"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setHeaderDark } from "@/lib/tone-store";

/**
 * Fundo contínuo: as seções declaram `data-tone="#hex"` e o fundo da página
 * se transforma suavemente de um tom para o outro conforme a rolagem.
 *
 * Desempenho: as posições das seções são medidas só quando o layout muda
 * (ResizeObserver); a cada quadro de rolagem nenhuma leitura de layout é
 * feita, e o estilo só é escrito quando a cor realmente muda.
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const smooth = (t: number) => t * t * (3 - 2 * t);
const luminance = ([r, g, b]: [number, number, number]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
const HEADER_PROBE = 40;

export function ScrollTone() {
  const pathname = usePathname();
  useEffect(() => {
    let sections: { top: number; bottom: number; rgb: [number, number, number]; dark: boolean }[] = [];
    let vh = innerHeight;
    let lastColor = "";
    const measure = () => {
      vh = innerHeight;
      sections = [...document.querySelectorAll<HTMLElement>("[data-tone]")].map((el) => {
        const r = el.getBoundingClientRect();
        const rgb = hexToRgb(el.dataset.tone!);
        // data-header-tone: seção com fundo próprio (ex.: painel escuro) sobre
        // um tom de página diferente — o header segue o fundo real
        const headerRgb = el.dataset.headerTone ? hexToRgb(el.dataset.headerTone) : rgb;
        return { top: r.top + scrollY, bottom: r.bottom + scrollY, rgb, dark: luminance(headerRgb) < 0.45 };
      });
    };
    let raf = 0;
    const paint = () => {
      raf = 0;
      if (!sections.length) {
        setHeaderDark(false);
        return;
      }
      const y = scrollY;
      const marker = y + vh * 0.55;
      const blend = vh * 0.32;
      let i = sections.findIndex((s) => marker < s.bottom);
      if (i === -1) i = sections.length - 1;
      let [r, g, b] = sections[i].rgb;
      const next = sections[i + 1];
      if (next) {
        const t = smooth(Math.min(1, Math.max(0, (marker - (sections[i].bottom - blend)) / blend)));
        r += (next.rgb[0] - r) * t; g += (next.rgb[1] - g) * t; b += (next.rgb[2] - b) * t;
        // passa por um azul profundo (só quando os dois tons são realmente diferentes)
        const [r0, g0, b0] = sections[i].rgb;
        const dist = Math.hypot(next.rgb[0] - r0, next.rgb[1] - g0, next.rgb[2] - b0);
        const tint = 4 * t * (1 - t) * 0.38 * Math.min(1, dist / 220);
        r += (31 - r) * tint; g += (79 - g) * tint; b += (214 - b) * tint;
      }
      const color = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
      if (color !== lastColor) {
        document.body.style.backgroundColor = color;
        lastColor = color;
      }
      // tom da seção sob o header (vidro claro ou escuro)
      const probe = y + HEADER_PROBE;
      const under = sections.find((s) => s.top <= probe && s.bottom > probe);
      setHeaderDark(under ? under.dark : false);
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(paint); };
    const remeasure = () => { measure(); request(); };
    remeasure();
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", remeasure);
    return () => {
      ro.disconnect();
      removeEventListener("scroll", request);
      removeEventListener("resize", remeasure);
      cancelAnimationFrame(raf);
      document.body.style.backgroundColor = "";
    };
  }, [pathname]);
  return null;
}
