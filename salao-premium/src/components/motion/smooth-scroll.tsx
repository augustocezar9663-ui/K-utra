"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

/* Store externa: a instância do Lenis é um sistema fora do React */
let current: Lenis | null = null;
const listeners = new Set<() => void>();
function setCurrent(l: Lenis | null) {
  current = l;
  listeners.forEach((fn) => fn());
}
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const useLenis = () => useSyncExternalStore(subscribe, () => current, () => null);

/**
 * Rolagem suave e contínua (Lenis). Desligada para quem prefere movimento
 * reduzido. Âncoras internas (#secao e /#secao na home) deslizam até o alvo.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenis = useLenis();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true, anchors: false });
    let raf = 0;
    const loop = (t: number) => {
      l.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    setCurrent(l);

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement).closest("a");
      const href = a?.getAttribute("href");
      if (!a || !href || a.target === "_blank") return;
      const hash = href.startsWith("#") ? href : href.startsWith("/#") && pathRef.current === "/" ? href.slice(1) : null;
      if (!hash) return;
      const target = hash === "#" ? null : document.querySelector(hash);
      if (hash !== "#" && !target) return;
      e.preventDefault();
      l.scrollTo((target as HTMLElement) ?? 0, { offset: hash === "#inicio" ? 0 : -72, duration: 1.6 });
      history.replaceState(null, "", hash === "#" ? location.pathname : hash);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      l.destroy();
      setCurrent(null);
    };
  }, []);

  // nova rota começa do topo
  useEffect(() => {
    if (!location.hash) lenis?.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);

  return <>{children}</>;
}
