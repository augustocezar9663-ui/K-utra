"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Fundo contínuo: as seções declaram `data-tone="#hex"` e o fundo da página
 * se transforma suavemente de um tom para o outro conforme a rolagem,
 * em vez de "cortes" secos entre seções.
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const smooth = (t: number) => t * t * (3 - 2 * t);

export function ScrollTone() {
  const pathname = usePathname();
  useEffect(() => {
    let sections: { top: number; bottom: number; rgb: [number, number, number] }[] = [];
    const measure = () => {
      sections = [...document.querySelectorAll<HTMLElement>("[data-tone]")].map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + scrollY, bottom: r.bottom + scrollY, rgb: hexToRgb(el.dataset.tone!) };
      });
    };
    let raf = 0;
    const paint = () => {
      raf = 0;
      if (!sections.length) return;
      const vh = innerHeight;
      const marker = scrollY + vh * 0.55;
      const blend = vh * 0.32;
      let i = sections.findIndex((s) => marker < s.bottom);
      if (i === -1) i = sections.length - 1;
      let [r, g, b] = sections[i].rgb;
      const next = sections[i + 1];
      if (next) {
        const t = smooth(Math.min(1, Math.max(0, (marker - (sections[i].bottom - blend)) / blend)));
        r += (next.rgb[0] - r) * t; g += (next.rgb[1] - g) * t; b += (next.rgb[2] - b) * t;
        // passa por um azul profundo em vez de um cinza neutro
        // só tinge quando os dois tons são realmente diferentes
        const [r0, g0, b0] = sections[i].rgb;
        const dist = Math.hypot(next.rgb[0] - r0, next.rgb[1] - g0, next.rgb[2] - b0);
        const warm = 4 * t * (1 - t) * 0.38 * Math.min(1, dist / 220);
        r += (31 - r) * warm; g += (79 - g) * warm; b += (214 - b) * warm;
      }
      const color = `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
      document.body.style.backgroundColor = color;
      document.documentElement.style.setProperty("--tone", color);
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
