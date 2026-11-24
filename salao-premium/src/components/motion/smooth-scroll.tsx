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
      let target: HTMLElement | null = null;
      if (hash !== "#") {
        try {
          target = document.getElementById(decodeURIComponent(hash.slice(1)));
        } catch {
          target = null;
        }
        if (!target) return;
      }
      // fase de captura: roda antes do onClick do <Link> do Next, que
      // desistiria da navegação ao ver o preventDefault
      e.preventDefault();
      // o menu móvel para o Lenis; ele fecha neste mesmo clique
      l.start();
      l.scrollTo(target ?? 0, { offset: hash === "#inicio" ? 0 : -72, duration: 1.6, force: true });
      history.replaceState(history.state, "", hash === "#" ? location.pathname : hash);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      cancelAnimationFrame(raf);
      l.destroy();
      setCurrent(null);
    };
  }, []);

  // voltar/avançar no histórico: o navegador/Next restauram a posição
  const popRef = useRef(-Infinity);
  useEffect(() => {
    const onPop = () => { popRef.current = performance.now(); };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  // nova rota (navegação para frente) começa do topo — não no primeiro
  // carregamento, para não desfazer a restauração de rolagem do reload
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const fromHistory = performance.now() - popRef.current < 1500;
    if (!fromHistory && !location.hash) lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);

  return <>{children}</>;
}
