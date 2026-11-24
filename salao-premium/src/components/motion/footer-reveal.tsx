"use client";

import { useEffect, useRef, useState } from "react";

/**
 * O rodapé fica "por baixo" do conteúdo: ao chegar ao fim, a página sobe e
 * o revela parado no lugar (máscara com clip-path + posição fixa).
 */
export function FooterReveal({ children }: { children: React.ReactNode }) {
  const inner = useRef<HTMLDivElement>(null);
  const [h, setH] = useState<number | null>(null);
  const [fits, setFits] = useState(true);
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setH(el.offsetHeight);
      setFits(el.offsetHeight < innerHeight * 0.92);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!fits) return <div ref={inner}>{children}</div>;
  return (
    <div className="relative" style={{ height: h ?? undefined, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}>
      <div ref={inner} className={h ? "fixed inset-x-0 bottom-0" : ""}>
        {children}
      </div>
    </div>
  );
}
