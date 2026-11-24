"use client";
import { motion, useScroll, useSpring } from "motion/react";

/** Linha fina de progresso da leitura, no topo. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent-deep"
      style={{ scaleX }}
    />
  );
}
