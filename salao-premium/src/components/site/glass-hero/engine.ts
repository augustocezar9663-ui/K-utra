/**
 * Motor WebGL da hero "vidro estilhaçado".
 * Inspirado no conceito "Designed in glass": uma página escura cortada em
 * placas grossas de vidro fumê, com o conteúdo impresso nas placas.
 * Adaptado à identidade do salão (carvão quente, champagne, Cormorant) e
 * ao scroll: rolar a página estilhaça as placas e revela o restante do site.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ------------------------------------------------------------------ */
export interface HeroCopy {
  eyebrow: string;
  lines: { text: string; italic?: boolean }[];
  sub: string[];
  primary: string;
  secondary: string;
  footLeft: string;
  footRight: string;
}

export type HoverKey = "primary" | "secondary" | null;

export interface TextItem {
  key: string;
  text: string;
  x: number;
  y: number;
  size: number;
  weight: number;
  serif: boolean;
  italic?: boolean;
  tracking: number; // em
  lineHeight: number;
  align?: "left" | "right" | "center";
  w?: number;
  h?: number;
  role?: "h1" | "p" | "primary" | "secondary" | "small";
}

export interface HeroLayout {
  w: number;
  h: number;
  items: TextItem[];
}

export interface GlassHeroHandle {
  setScroll(p: number): void;
  setHover(key: HoverKey): void;
  dispose(): void;
}

interface Options {
  canvas: HTMLCanvasElement;
  layer: HTMLElement;
  copy: HeroCopy;
  fonts: { serif: string; sans: string };
  onLayout: (layout: HeroLayout) => void;
  onIntroDone?: () => void;
}

/* ------------------------------------------------------------------ */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeOutBack = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
type V2 = { x: number; y: number };

const PALETTE = {
  glass: 0x1c1915,
  glow: [0.84, 0.74, 0.58] as const, // champagne
  key: 0xfff1e2,
  champagne: "#d6c1a3",
};

/* Padrões de cortes (coordenadas normalizadas do painel: x → direita, y ↓).
   kind: 0 fixo · 1 borda horizontal (move em x) · 3 borda vertical (move em y) · 2 junção */
type PatternDef = { P: Record<string, [number, number, number]>; CELLS: Record<string, string[]> };
const LANDSCAPE: PatternDef = {
  P: {
    TL: [0, 0, 0], TR: [1, 0, 0], BR: [1, 1, 0], BL: [0, 1, 0],
    tAB: [0.22, 0, 1], tBC: [0.515, 0, 1], tCE: [0.84, 0, 1],
    bAD: [0.34, 1, 1], bDE: [0.865, 1, 1],
    J0: [0.385, 0.72, 2], J1: [0.48, 0.62, 2], J2: [0.716, 0.49, 2],
  },
  CELLS: {
    A: ["TL", "tAB", "J0", "bAD", "BL"],
    B: ["tAB", "tBC", "J1", "J0"],
    C: ["tBC", "tCE", "J2", "J1"],
    D: ["J0", "J1", "J2", "bDE", "bAD"],
    E: ["tCE", "TR", "BR", "bDE", "J2"],
  },
};
/* Retrato: a placa principal ocupa o topo inteiro (título, texto e botões
   ficam inteiros) e quatro placas menores formam a base. */
const PORTRAIT: PatternDef = {
  P: {
    TL: [0, 0, 0], TR: [1, 0, 0], BR: [1, 1, 0], BL: [0, 1, 0],
    l1: [0, 0.7, 3], r1: [1, 0.66, 3], r2: [1, 0.86, 3], b1: [0.34, 1, 1],
    J0: [0.38, 0.75, 2], J1: [0.66, 0.71, 2], J2: [0.54, 0.88, 2],
  },
  CELLS: {
    A: ["TL", "TR", "r1", "J1", "J0", "l1"],
    B: ["l1", "J0", "J2", "b1", "BL"],
    C: ["J0", "J1", "J2"],
    D: ["J1", "r1", "r2", "J2"],
    E: ["J2", "r2", "BR", "b1"],
  },
};

/* ------------------------------------------------------------------ */
export function createGlassHero(opts: Options): GlassHeroHandle {
  const { canvas, layer, copy, fonts } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  const isCoarse = matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isCoarse ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  let disposed = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 20000);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.42;
  const key = new THREE.DirectionalLight(PALETTE.key, 0.8);
  scene.add(key);

  /* ------------------------------ layout ------------------------------ */
  let W = 1, H = 1;
  const L = {
    bw: 1, bh: 1, S: 1, portrait: false,
    panel: { left: 0, right: 0, top: 0, bottom: 0, w: 1, h: 1 },
    radius: 20, depth: 13, bevel: 2.6, gap: 14, front: 15.6, cx: 0, cy: 0,
  };
  function computeLayout(width: number, height: number) {
    W = width; H = height;
    const phone = W < 700;
    const mx = phone ? 14 : 0.055 * W;
    const top = phone ? 76 : Math.max(98, 0.1 * H);
    const bottom = phone ? 18 : 0.055 * H;
    L.bw = W - 2 * mx; L.bh = H - top - bottom;
    L.S = L.bw / 1730;
    L.portrait = H > W;
    L.cx = mx + L.bw / 2 - W / 2;
    L.cy = H / 2 - (top + L.bh / 2);
    L.panel = { left: -L.bw / 2, right: L.bw / 2, top: L.bh / 2, bottom: -L.bh / 2, w: L.bw, h: L.bh };
    const s = Math.max(L.S, phone ? 0.42 : 0);
    L.radius = 20 * s; L.depth = 13 * s; L.bevel = 2.6 * s; L.gap = 14 * s;
    L.front = L.depth + L.bevel;
  }

  /* --------------------------- printed copy --------------------------- */
  const hover: { key: HoverKey } = { key: null };
  const PDPR = Math.min(2.5, Math.max(1.5, devicePixelRatio || 1));
  const printCanvas = document.createElement("canvas");

  function textLayout(): HeroLayout {
    const pw = L.panel.w, ph = L.panel.h, S = L.S;
    const portrait = L.portrait;
    const pad = (portrait ? 0.08 : 0.055) * pw;
    const items: TextItem[] = [];
    const eb = Math.max(10, 12 * S);
    const ebY = (portrait ? 0.07 : 0.14) * ph;
    items.push({ key: "eyebrow", role: "p", text: copy.eyebrow, x: pad, y: ebY, size: eb, weight: 600, serif: false, tracking: 0.3, lineHeight: 1 });
    const hs = portrait ? Math.min(0.125 * pw, 0.062 * ph) : Math.min(0.074 * pw, 0.152 * ph);
    let y = ebY + eb + (portrait ? 0.035 : 0.055) * ph;
    copy.lines.forEach((l, i) => {
      items.push({
        key: `h${i}`, role: "h1", text: l.text, x: pad - hs * 0.03, y, size: hs, weight: l.italic ? 400 : 300,
        serif: true, italic: l.italic, tracking: l.italic ? -0.01 : -0.012, lineHeight: 1,
      });
      y += hs * 0.94;
    });
    const ss = Math.max(13, 18 * S);
    y += (portrait ? 0.04 : 0.05) * ph;
    copy.sub.forEach((t, i) => {
      items.push({ key: `s${i}`, role: "p", text: t, x: pad, y: y + i * ss * 1.55, size: ss, weight: 400, serif: false, tracking: 0, lineHeight: 1 });
    });
    y += copy.sub.length * ss * 1.55 + (portrait ? 0.04 : 0.055) * ph;
    const bs = Math.max(10.5, 12.5 * S);
    const bh = Math.max(44, 58 * S);
    const bw = Math.max(210, 290 * S);
    items.push({ key: "primary", role: "primary", text: copy.primary, x: pad, y, w: bw, h: bh, size: bs, weight: 600, serif: false, tracking: 0.22, lineHeight: 1 });
    const sx = portrait ? pad : pad + bw + 34 * Math.max(S, 0.5);
    const sy = portrait ? y + bh + 0.03 * ph : y;
    items.push({ key: "secondary", role: "secondary", text: copy.secondary, x: sx, y: sy, w: 0, h: bh, size: bs, weight: 600, serif: false, tracking: 0.22, lineHeight: 1 });
    const fs = Math.max(9.5, 11 * S);
    const fy = ph - (portrait ? 0.045 : 0.07) * ph - fs;
    items.push({ key: "footL", role: "small", text: copy.footLeft, x: pad, y: fy, size: fs, weight: 600, serif: false, tracking: 0.3, lineHeight: 1 });
    items.push({ key: "footR", role: "small", text: copy.footRight, x: pw - pad, y: fy, size: fs, weight: 600, serif: false, tracking: 0.3, lineHeight: 1, align: "right" });
    return { w: pw, h: ph, items };
  }

  const supportsTracking = "letterSpacing" in CanvasRenderingContext2D.prototype;
  function fontOf(it: TextItem) {
    return `${it.italic ? "italic " : ""}${it.weight} ${it.size}px ${it.serif ? fonts.serif : fonts.sans}`;
  }
  function trackedWidth(ctx: CanvasRenderingContext2D, it: TextItem) {
    ctx.font = fontOf(it);
    const base = ctx.measureText(it.text).width;
    return base + it.tracking * it.size * it.text.length;
  }
  function drawText(ctx: CanvasRenderingContext2D, it: TextItem, x: number, y: number) {
    ctx.font = fontOf(it);
    const t = it.tracking * it.size;
    if (supportsTracking) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${t}px`;
      ctx.fillText(it.text, x, y);
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
    } else {
      let cx = x;
      for (const ch of it.text) {
        ctx.fillText(ch, cx, y);
        cx += ctx.measureText(ch).width + t;
      }
    }
  }

  let layout: HeroLayout = { w: 1, h: 1, items: [] };
  function drawPrint() {
    layout = textLayout();
    const c = printCanvas, ctx = c.getContext("2d")!;
    c.width = Math.round(layout.w * PDPR); c.height = Math.round(layout.h * PDPR);
    ctx.setTransform(PDPR, 0, 0, PDPR, 0, 0);
    ctx.clearRect(0, 0, layout.w, layout.h);
    ctx.textBaseline = "top";
    for (const it of layout.items) {
      const tw = trackedWidth(ctx, it);
      if (it.role === "primary") {
        const w = it.w!, h = it.h!;
        ctx.fillStyle = hover.key === "primary" ? "#ffffff" : PALETTE.champagne;
        ctx.beginPath(); ctx.roundRect(it.x, it.y, w, h, 2); ctx.fill();
        ctx.fillStyle = "#111111";
        drawText(ctx, it, it.x + (w - tw) / 2 + (it.tracking * it.size) / 2, it.y + (h - it.size) / 2 + it.size * 0.06);
        continue;
      }
      if (it.role === "secondary") {
        it.w = tw + 22;
        const ty = it.y + (it.h! - it.size) / 2 + it.size * 0.06;
        ctx.fillStyle = hover.key === "secondary" ? "#ffffff" : "rgba(255,255,255,.86)";
        drawText(ctx, it, it.x, ty);
        // seta
        ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(1, it.size * 0.09);
        const ax = it.x + tw + 8, ay = ty + it.size * 0.45, al = 10 + (hover.key === "secondary" ? 4 : 0);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + al, ay); ctx.moveTo(ax + al - 4, ay - 4); ctx.lineTo(ax + al, ay); ctx.lineTo(ax + al - 4, ay + 4); ctx.stroke();
        ctx.fillRect(it.x, ty + it.size * 1.55, hover.key === "secondary" ? tw : tw * 0.0, Math.max(1, it.size * 0.07));
        continue;
      }
      if (it.role === "h1") {
        if (it.italic) ctx.fillStyle = PALETTE.champagne;
        else {
          const g = ctx.createLinearGradient(0, it.y, 0, it.y + it.size);
          g.addColorStop(0, "#f4f0ea"); g.addColorStop(1, "#cfc7bb");
          ctx.fillStyle = g;
        }
      } else if (it.key === "eyebrow") ctx.fillStyle = "rgba(214,193,163,.9)";
      else if (it.role === "small") ctx.fillStyle = "rgba(255,255,255,.36)";
      else ctx.fillStyle = "rgba(255,255,255,.62)";
      const x = it.align === "right" ? it.x - tw : it.x;
      if (it.key === "eyebrow") {
        ctx.fillRect(x, it.y + it.size * 0.5, it.size * 3.2, 1);
        drawText(ctx, it, x + it.size * 4.4, it.y);
      } else drawText(ctx, it, x, it.y);
    }
    if (printTex) printTex.needsUpdate = true;
    opts.onLayout(layout);
  }

  /* ------------------------------ glass ------------------------------- */
  const glow = { uPointer: { value: new THREE.Vector3(1e6, 1e6, 0) }, uGlow: { value: 0 }, uS: { value: 1 } };
  function glassMaterial() {
    const m = new THREE.MeshPhysicalMaterial({
      color: PALETTE.glass, roughness: 0.36, metalness: 0,
      clearcoat: 0.7, clearcoatRoughness: 0.12, specularIntensity: 0.7,
      iridescence: 0.5, iridescenceIOR: 1.3, iridescenceThicknessRange: [300, 520],
      envMapIntensity: 1,
      transparent: true,
    });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, glow);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nuniform vec3 uPointer;\nuniform float uGlow;\nuniform float uS;")
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float gd = distance(vWPos, uPointer) / (300.0 * uS);
          totalEmissiveRadiance += vec3(${PALETTE.glow.join(",")}) * .16 * uGlow * exp(-1.6 * gd * gd);`,
        );
    };
    m.customProgramCacheKey = () => "salon-glass-glow";
    return m;
  }

  function roundedInsetShape(pts: V2[], inset: number, r: number) {
    const n = pts.length;
    let area = 0;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a.x * b.y - b.x * a.y; }
    const ccw = area > 0;
    const lines = pts.map((a, i) => {
      const b = pts[(i + 1) % n];
      let dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
      const nx = ccw ? -dy : dy, ny = ccw ? dx : -dx;
      return { px: a.x + nx * inset, py: a.y + ny * inset, dx, dy };
    });
    const v: V2[] = [];
    for (let i = 0; i < n; i++) {
      const l1 = lines[(i - 1 + n) % n], l2 = lines[i];
      const den = l1.dx * l2.dy - l1.dy * l2.dx;
      if (Math.abs(den) < 1e-6) { v.push({ x: l2.px, y: l2.py }); continue; }
      const t = ((l2.px - l1.px) * l2.dy - (l2.py - l1.py) * l2.dx) / den;
      v.push({ x: l1.px + l1.dx * t, y: l1.py + l1.dy * t });
    }
    const shape = new THREE.Shape();
    for (let i = 0; i < n; i++) {
      const p = v[i], a = v[(i - 1 + n) % n], b = v[(i + 1) % n];
      const la = Math.hypot(a.x - p.x, a.y - p.y) || 1, lb = Math.hypot(b.x - p.x, b.y - p.y) || 1;
      const ua = { x: (a.x - p.x) / la, y: (a.y - p.y) / la }, ub = { x: (b.x - p.x) / lb, y: (b.y - p.y) / lb };
      const ang = Math.acos(clamp(ua.x * ub.x + ua.y * ub.y, -1, 1));
      const t = Math.min(r / Math.tan(Math.max(ang, 0.05) / 2), la * 0.45, lb * 0.45);
      const pin = { x: p.x + ua.x * t, y: p.y + ua.y * t }, pout = { x: p.x + ub.x * t, y: p.y + ub.y * t };
      if (i === 0) shape.moveTo(pin.x, pin.y); else shape.lineTo(pin.x, pin.y);
      shape.quadraticCurveTo(p.x, p.y, pout.x, pout.y);
    }
    shape.closePath();
    return { shape, verts: v };
  }

  /* ----------------------------- pattern ------------------------------ */
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const drift: Record<string, { px: number; py: number; fx: number; fy: number }> = {};
  for (const k of new Set([...Object.keys(LANDSCAPE.P), ...Object.keys(PORTRAIT.P)])) {
    drift[k] = { px: 10 + rnd() * 10, py: 10 + rnd() * 10, fx: rnd() * 6.28, fy: rnd() * 6.28 };
  }
  const pattern = () => (L.portrait ? PORTRAIT : LANDSCAPE);
  const patPointer = { x: -9, y: -9, tx: -9, ty: -9 };

  function patternPoints(t: number) {
    const out: Record<string, V2> = {};
    const amp = L.portrait ? 0.6 : 1;
    for (const [k, [x0, y0, kind]] of Object.entries(pattern().P)) {
      if (kind === 0) { out[k] = { x: x0, y: y0 }; continue; }
      const sx = Math.sin((t / drift[k].px) * 6.283 + drift[k].fx);
      const sy = Math.sin((t / drift[k].py) * 6.283 + drift[k].fy);
      let x = x0 + (kind === 1 || kind === 2 ? 0.03 * amp * sx : 0);
      let y = y0 + (kind === 2 ? 0.05 * amp * sy : kind === 3 ? 0.025 * amp * sy : 0);
      const dx = x - patPointer.x, dy = y - patPointer.y, d = Math.hypot(dx, dy);
      if (d < 0.6 && d > 1e-4) {
        const f = 0.05 * Math.pow(1 - d / 0.6, 2);
        if (kind !== 3) x += (dx / d) * f;
        if (kind !== 1) y += (dy / d) * f;
      }
      out[k] = {
        x: kind === 3 ? x0 : clamp(x, 0.02, 0.98),
        y: kind === 1 ? y0 : clamp(y, 0.05, 0.95),
      };
    }
    return out;
  }
  const toSlab = (x: number, y: number): V2 => ({ x: L.panel.left + x * L.panel.w, y: L.panel.top - y * L.panel.h });
  const fromSlab = (sx: number, sy: number) => ({ u: (sx - L.panel.left) / L.panel.w, v: (L.panel.top - sy) / L.panel.h });

  /* ------------------------------ pieces ------------------------------ */
  const slab = new THREE.Group();
  scene.add(slab);
  let printTex: THREE.CanvasTexture | null = null;

  interface Spring { x: number; v: number }
  interface Piece {
    id: string; group: THREE.Group; inner: THREE.Group; glass: THREE.Mesh; print: THREE.Mesh;
    mat: THREE.MeshPhysicalMaterial; printMat: THREE.MeshBasicMaterial;
    centroid: THREE.Vector2; half: THREE.Vector2; lift: Spring; tx: Spring; ty: Spring;
    fly: { axis: THREE.Vector3; spin: number; out: number; down: number; vz: number };
  }
  const pieces: Piece[] = Object.keys(LANDSCAPE.CELLS).map((id) => {
    const group = new THREE.Group(), inner = new THREE.Group();
    group.add(inner); slab.add(group);
    const mat = glassMaterial();
    const glass = new THREE.Mesh(new THREE.BufferGeometry(), mat);
    const printMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false });
    const print = new THREE.Mesh(new THREE.BufferGeometry(), printMat);
    print.renderOrder = 2;
    inner.add(glass, print);
    glass.userData.piece = id;
    const r = (a: number, b: number) => a + rnd() * (b - a);
    return {
      id, group, inner, glass, print, mat, printMat,
      centroid: new THREE.Vector2(), half: new THREE.Vector2(1, 1),
      lift: { x: 0, v: 0 }, tx: { x: 0, v: 0 }, ty: { x: 0, v: 0 },
      fly: {
        axis: new THREE.Vector3(r(-1, 1), r(-1, 1), r(-0.6, 0.6)).normalize(),
        spin: r(2.0, 3.6), out: r(320, 620), down: r(80, 260), vz: r(420, 800),
      },
    };
  });

  function rebuild(t: number) {
    const pts = patternPoints(t);
    for (const pc of pieces) {
      const v = pattern().CELLS[pc.id].map((k) => toSlab(pts[k].x, pts[k].y));
      const { shape, verts } = roundedInsetShape(v, L.gap / 2, L.radius);
      let cx = 0, cy = 0, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of verts) {
        cx += p.x; cy += p.y;
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      cx /= verts.length; cy /= verts.length;
      pc.centroid.set(cx, cy);
      pc.half.set(Math.max(1, (maxX - minX) / 2), Math.max(1, (maxY - minY) / 2));
      pc.inner.position.set(-cx, -cy, 0);
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: L.depth, bevelEnabled: true, bevelThickness: L.bevel, bevelSize: L.bevel, bevelSegments: 3, curveSegments: 5,
      });
      pc.glass.geometry.dispose(); pc.glass.geometry = g;
      const sg = new THREE.ShapeGeometry(shape, 5);
      const pos = sg.attributes.position, uv = sg.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, (pos.getX(i) - L.panel.left) / L.panel.w, (pos.getY(i) - L.panel.bottom) / L.panel.h);
      }
      uv.needsUpdate = true;
      sg.translate(0, 0, L.front + 0.35);
      pc.print.geometry.dispose(); pc.print.geometry = sg;
    }
  }

  /* ------------------------------ resize ------------------------------ */
  let lastRebuild = -1;
  const clock = new THREE.Clock();
  function resize() {
    const rect = canvas.getBoundingClientRect();
    computeLayout(Math.max(1, rect.width), Math.max(1, rect.height));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.position.set(0, 0, H / 2 / Math.tan(THREE.MathUtils.degToRad(15)));
    camera.near = 10; camera.far = camera.position.z * 4;
    camera.updateProjectionMatrix();
    slab.position.set(L.cx, L.cy, 0);
    key.position.set(-0.6 * W, 0.7 * H, camera.position.z);
    glow.uS.value = Math.max(L.S, 0.35);
    rebuild(clock.elapsedTime);
    drawPrint();
    if (!printTex) {
      printTex = new THREE.CanvasTexture(printCanvas);
      printTex.colorSpace = THREE.SRGBColorSpace;
      printTex.anisotropy = 8;
      for (const pc of pieces) { pc.printMat.map = printTex; pc.printMat.needsUpdate = true; }
    } else {
      // canvas mudou de tamanho: recria a textura
      printTex.dispose();
      printTex = new THREE.CanvasTexture(printCanvas);
      printTex.colorSpace = THREE.SRGBColorSpace;
      printTex.anisotropy = 8;
      for (const pc of pieces) { pc.printMat.map = printTex; pc.printMat.needsUpdate = true; }
    }
    wake();
  }
  const ro = new ResizeObserver(() => { if (!disposed) resize(); });
  ro.observe(canvas);

  /* ------------------------------ pointer ----------------------------- */
  const pointer = { nx: 0, ny: 0, inside: false };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = canvas.getBoundingClientRect();
    pointer.nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    pointer.inside = e.clientY >= r.top && e.clientY <= r.bottom;
    wake();
  };
  const onLeave = () => { pointer.inside = false; };
  addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  addEventListener("blur", onLeave);

  /* ------------------------------ state ------------------------------- */
  let scrollP = 0, scrollE = 0;
  let introT = 0, introDone = false;
  let visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); });
  io.observe(canvas);

  /* --------------------------- projection ----------------------------- */
  const tmpV = new THREE.Vector3();
  function screenOf(x: number, y: number, z: number) {
    tmpV.set(x, y, z).applyMatrix4(slab.matrixWorld).project(camera);
    return [(tmpV.x * 0.5 + 0.5) * W, (-tmpV.y * 0.5 + 0.5) * H] as const;
  }
  function quadToCss(w: number, h: number, p0: readonly number[], p1: readonly number[], p2: readonly number[], p3: readonly number[]) {
    const [x0, y0] = p0, [x1, y1] = p1, [x2, y2] = p2, [x3, y3] = p3;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, hh = (dx1 * dy3 - dx3 * dy1) / den;
    const a = (x1 - x0 + g * x1) / w, b = (x3 - x0 + hh * x3) / h;
    const d = (y1 - y0 + g * y1) / w, e = (y3 - y0 + hh * y3) / h;
    return `matrix3d(${a},${d},0,${g / w},${b},${e},0,${hh / h},0,0,1,0,${x0},${y0},0,1)`;
  }
  function mapLayer() {
    const r = L.panel, z = L.front;
    layer.style.transform = quadToCss(r.w, r.h, screenOf(r.left, r.top, z), screenOf(r.right, r.top, z), screenOf(r.right, r.bottom, z), screenOf(r.left, r.bottom, z));
  }

  /* ------------------------------- loop ------------------------------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane();
  const slabNormal = new THREE.Vector3(), slabPoint = new THREE.Vector3(), hit = new THREE.Vector3(), localHit = new THREE.Vector3();
  const qTip = new THREE.Quaternion(), qFly = new THREE.Quaternion(), eul = new THREE.Euler();
  const tilt = { x: THREE.MathUtils.degToRad(0.8), y: THREE.MathUtils.degToRad(-1.2) };
  const dir = new THREE.Vector2();
  let raf = 0, running = false, idleFrames = 0;
  const reduceLoad = isCoarse;

  function spring(s: Spring, target: number, dt: number, k = 170, c = 19) {
    s.v += (k * (target - s.x) - c * s.v) * dt;
    s.x += s.v * dt;
  }

  function frame() {
    raf = 0;
    const dt = Math.min(clock.getDelta(), 1 / 30);
    const t = clock.elapsedTime;

    // intro: as placas chegam voando (ease-out-back, 30 ms entre peças)
    if (!introDone) {
      introT += dt;
      if (introT > 0.15 + (pieces.length - 1) * 0.03 + 0.72) { introDone = true; opts.onIntroDone?.(); }
    }
    const shattered = scrollE > 0.002;
    const interactive = pointer.inside && !shattered && introDone;

    // inclinação global (suavização exponencial de 0,3 s)
    const tgtY = THREE.MathUtils.degToRad(interactive ? pointer.nx * 7 - 1.2 : -1.2);
    const tgtX = THREE.MathUtils.degToRad(interactive ? -pointer.ny * 5.5 + 0.8 : 0.8);
    const kS = 1 - Math.exp(-dt / 0.3);
    tilt.y += (tgtY - tilt.y) * kS; tilt.x += (tgtX - tilt.x) * kS;
    slab.rotation.set(tilt.x, tilt.y, 0);
    slab.updateMatrixWorld(true);

    ndc.set(pointer.nx, pointer.ny);
    raycaster.setFromCamera(ndc, camera);
    slabNormal.set(0, 0, 1).applyQuaternion(slab.quaternion);
    slabPoint.set(0, 0, L.front).applyMatrix4(slab.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(slabNormal, slabPoint);
    const onPlane = raycaster.ray.intersectPlane(plane, hit);
    if (onPlane && interactive) {
      glow.uPointer.value.copy(hit);
      localHit.copy(hit); slab.worldToLocal(localHit);
      const pp = fromSlab(localHit.x, localHit.y);
      patPointer.tx = pp.u; patPointer.ty = pp.v;
      if (patPointer.x < -5) { patPointer.x = pp.u; patPointer.y = pp.v; }
    } else { patPointer.tx = -9; patPointer.ty = -9; }
    const kp = 1 - Math.exp(-dt / 0.25);
    patPointer.x += (patPointer.tx - patPointer.x) * kp; patPointer.y += (patPointer.ty - patPointer.y) * kp;
    glow.uGlow.value += ((interactive ? 1 : 0) - glow.uGlow.value) * (1 - Math.exp(-dt / 0.25));

    if (t - lastRebuild > (reduceLoad ? 1 / 30 : 1 / 45) && !shattered) { rebuild(t); lastRebuild = t; }

    let hovered: string | null = null;
    if (interactive) {
      const hits = raycaster.intersectObjects(pieces.map((p) => p.glass), false);
      if (hits.length) hovered = hits[0].object.userData.piece as string;
    }

    const S = L.S;
    let moving = false;
    pieces.forEach((pc, i) => {
      // estilhaçamento: maior entre intro e scroll (com pequeno escalonamento)
      const introPiece = introDone ? 0 : 1 - easeOutBack(clamp((introT - 0.15 - i * 0.03) / 0.72, 0, 1));
      const stag = clamp(scrollE * 1.12 - i * 0.025, 0, 1);
      const scrollPiece = Math.pow(stag, 1.15);
      // mantém a leve ultrapassagem (overshoot) da chegada
      const e = scrollPiece > 0 ? Math.max(introPiece, scrollPiece) : introPiece;
      const isHover = hovered === pc.id;
      let tipX = 0, tipY = 0;
      if (isHover && onPlane) {
        const dxn = clamp((localHit.x - pc.centroid.x) / pc.half.x, -1, 1);
        const dyn = clamp((localHit.y - pc.centroid.y) / pc.half.y, -1, 1);
        tipY = 0.24 * dxn; tipX = -0.24 * dyn;
        const m = Math.hypot(tipX, tipY);
        if (m > 0.24) { tipX *= 0.24 / m; tipY *= 0.24 / m; }
      }
      spring(pc.lift, isHover ? 50 * S : 0, dt);
      spring(pc.tx, tipX, dt); spring(pc.ty, tipY, dt);
      if (Math.abs(pc.lift.v) + Math.abs(pc.tx.v) + Math.abs(pc.ty.v) > 0.002) moving = true;
      const h = clamp(pc.lift.x / (50 * S), 0, 1.2);
      pc.mat.iridescence = 0.5 + 0.5 * h;
      pc.mat.envMapIntensity = 1 + 0.9 * h;

      const tau = e * 0.62;
      dir.set(pc.centroid.x, pc.centroid.y);
      if (dir.lengthSq() < 1) dir.set(0, -1);
      dir.normalize();
      const vx = dir.x * pc.fly.out * S, vy = dir.y * pc.fly.out * S - pc.fly.down * S, vz = pc.fly.vz * S;
      const gy = -1500 * S;
      pc.group.position.set(pc.centroid.x + vx * tau, pc.centroid.y + vy * tau + 0.5 * gy * tau * tau, pc.lift.x + vz * tau);
      eul.set(pc.tx.x, pc.ty.x, 0); qTip.setFromEuler(eul);
      qFly.setFromAxisAngle(pc.fly.axis, e * pc.fly.spin);
      pc.group.quaternion.copy(qFly).multiply(qTip);
      const fade = 1 - clamp((e - 0.72) / 0.26, 0, 1);
      pc.mat.opacity = fade;
      pc.printMat.opacity = fade;
      pc.group.visible = fade > 0.002;
    });

    // a camada de texto real só existe enquanto o vidro está montado
    const textAlpha = introDone ? clamp(1 - scrollE * 14, 0, 1) : 0;
    layer.style.opacity = String(textAlpha);
    layer.style.visibility = textAlpha > 0.01 ? "visible" : "hidden";
    if (textAlpha > 0) mapLayer();

    renderer.render(scene, camera);

    // pausa quando nada se move (economia de bateria)
    const settled = introDone && !interactive && !moving && Math.abs(glow.uGlow.value) < 0.01 && (scrollE >= 0.999 || !visible);
    idleFrames = settled ? idleFrames + 1 : 0;
    if (idleFrames < 3) schedule();
    else running = false;
  }
  function schedule() { if (disposed) return; if (!raf) raf = requestAnimationFrame(frame); running = true; }
  function wake() { if (!running) { clock.getDelta(); schedule(); } }

  // fontes antes do primeiro desenho
  Promise.all([
    document.fonts.load(`300 64px ${fonts.serif}`),
    document.fonts.load(`italic 400 64px ${fonts.serif}`),
    document.fonts.load(`600 14px ${fonts.sans}`),
    document.fonts.load(`400 14px ${fonts.sans}`),
  ]).catch(() => {}).finally(() => { if (disposed) return; resize(); schedule(); });

  return {
    setScroll(p: number) {
      scrollP = clamp(p, 0, 1);
      scrollE = clamp((scrollP - 0.015) / 0.97, 0, 1);
      wake();
    },
    setHover(k: HoverKey) {
      if (hover.key === k) return;
      hover.key = k;
      drawPrint();
      wake();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0; running = false;
      ro.disconnect(); io.disconnect();
      removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      removeEventListener("blur", onLeave);
      for (const pc of pieces) { pc.glass.geometry.dispose(); pc.print.geometry.dispose(); pc.mat.dispose(); pc.printMat.dispose(); }
      printTex?.dispose(); envTex.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
