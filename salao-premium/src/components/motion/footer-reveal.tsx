"use client";

import { useEffect, useRef, useState } from "react";

/**
 * O rodapé fica "por baixo" do conteúdo: ao chegar ao fim, a página sobe e
 * o revela parado no lugar (máscara com clip-path + posição fixa).
 *
 * - Só fica `fixed` enquanto a área dele está na tela; no resto da página
 *   fica no fluxo, sem uma camada fixa do tamanho do rodapé sobreposta à
 *   página o tempo todo (composição e acessibilidade mais limpas).
 * - Se o rodapé não couber na tela, volta ao fluxo normal (senão o topo dele
 *   ficaria inalcançável).
 */
export function FooterReveal({ children }: { children: React.ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | null>(null);
  const [fits, setFits] = useState(true);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => {
      setH(el.offsetHeight);
      setFits(el.offsetHeight < innerHeight * 0.92);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: "0px 0px 1px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reveal = fits && h !== null;
  return (
    <div
      ref={wrapper}
      className="relative"
      style={reveal ? { height: h, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" } : undefined}
    >
      <div ref={inner} className={reveal ? (near ? "fixed inset-x-0 bottom-0" : "absolute inset-x-0 bottom-0") : ""}>
        {children}
      </div>
    </div>
  );
}
