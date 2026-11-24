"use client";
import { MotionConfig } from "motion/react";

/** Respeita automaticamente `prefers-reduced-motion` em todas as animações. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: [0.23, 1, 0.32, 1] }}>
      {children}
    </MotionConfig>
  );
}
