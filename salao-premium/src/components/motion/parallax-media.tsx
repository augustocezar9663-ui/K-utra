"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * Moldura com revelação por máscara ao entrar na tela e parallax interno
 * contínuo: a imagem desliza mais devagar que a página.
 */
export function ParallaxFrame({
  children,
  className = "",
  strength = 9,
  reveal = true,
  from = "bottom",
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  reveal?: boolean;
  from?: "bottom" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : [`-${strength}%`, `${strength}%`]);
  const hidden = from === "left" ? "inset(0 100% 0 0)" : from === "right" ? "inset(0 0 0 100%)" : "inset(100% 0 0 0)";
  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      initial={reveal && !reduce ? { clipPath: hidden } : false}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div className="absolute inset-[-12%_0]" style={{ y }}>
        <motion.div
          className="h-full w-full"
          initial={reveal && !reduce ? { scale: 1.18 } : false}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
