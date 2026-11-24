"use client";

import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * Painel que "abre" até a largura total ao entrar na tela e se recolhe ao
 * sair (clip-path com cantos arredondados) — a página parece uma superfície
 * contínua em vez de blocos empilhados.
 */
export function ExpandPanel({
  children,
  className = "",
  ...rest
}: { children: React.ReactNode; className?: string } & Omit<React.HTMLAttributes<HTMLElement>, "children" | "className">) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start 0.2"] });
  const { scrollYProgress: leave } = useScroll({ target: ref, offset: ["end 0.8", "end start"] });
  const side = useTransform(() => (reduce ? 0 : 4.5 * (1 - enter.get()) + 4.5 * leave.get()));
  const radius = useTransform(() => (reduce ? 0 : 44 * (1 - enter.get()) + 44 * leave.get()));
  const clipPath = useMotionTemplate`inset(0% ${side}% 0% ${side}% round ${radius}px)`;
  return (
    <motion.section ref={ref} className={className} style={{ clipPath }} {...(rest as object)}>
      {children}
    </motion.section>
  );
}
