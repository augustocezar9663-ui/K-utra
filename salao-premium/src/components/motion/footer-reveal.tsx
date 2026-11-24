"use client";

import { useEffect, useRef, useState } from "react";

/**
 * O rodapé fica "por baixo" do conteúdo: ao chegar ao fim, a página sobe e
 * o revela parado no lugar (máscara com clip-path + posição fixa).
 * Se o rodapé não couber na tela, volta ao fluxo normal (senão o topo dele
 * ficaria inalcançável).
 */
export function FooterReveal({ children }: { children: React.ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | null>(null);
  const [fits, setFits] = useState(true);
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => {
      setH(el.offsetHeight);
      setFits(el.offsetHeight < innerHeight * 0.92);
    };
    // mesmo elemento observado em qualquer modo; a janela também conta
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      removeEventListener("resize", measure);
    };
  }, []);
  const reveal = fits && h !== null;
  return (
    <div
      className="relative"
      style={reveal ? { height: h, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" } : undefined}
    >
      <div ref={inner} className={reveal ? "fixed inset-x-0 bottom-0" : ""}>
        {children}
      </div>
    </div>
  );
}
