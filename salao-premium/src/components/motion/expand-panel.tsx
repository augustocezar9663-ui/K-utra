"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * Painel que "abre" até a largura total ao entrar na tela e se recolhe ao
 * sair — a página parece uma superfície contínua em vez de blocos
 * empilhados. Só a camada de fundo é animada, e apenas com `transform`
 * (composição na GPU, sem redesenhar o conteúdo a cada quadro).
 */
export function ExpandPanel({
  children,
  className = "",
  bgClassName = "bg-ink",
  ...rest
}: { children: React.ReactNode; className?: string; bgClassName?: string } & Omit<
  React.HTMLAttributes<HTMLElement>,
  "children" | "className"
>) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start 0.2"] });
  const { scrollYProgress: leave } = useScroll({ target: ref, offset: ["end 0.8", "end start"] });
  const scaleX = useTransform(() => (reduce ? 1 : 1 - 0.09 * (1 - enter.get()) - 0.09 * leave.get()));
  return (
    <section ref={ref} className={`relative isolate ${className}`} {...rest}>
      <motion.div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 will-change-transform ${bgClassName} ${reduce ? "" : "rounded-[40px]"}`}
        style={{ scaleX }}
      />
      {children}
    </section>
  );
}
