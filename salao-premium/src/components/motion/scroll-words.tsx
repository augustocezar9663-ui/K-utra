"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";

/** Parágrafo que "acende" palavra por palavra conforme a rolagem avança. */
export function ScrollWords({ text, className = "", dim = 0.3 }: { text: string; className?: string; dim?: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.62"] });
  const words = text.split(" ");
  // mesma estrutura no servidor e no cliente (evita erro de hidratação);
  // com movimento reduzido as palavras já aparecem acesas
  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} dim={reduce ? 1 : dim}>
            {w}
          </Word>
        ))}
      </span>
    </p>
  );
}

function Word({ children, progress, range, dim }: { children: string; progress: MotionValue<number>; range: [number, number]; dim: number }) {
  const opacity = useTransform(progress, range, [dim, 1]);
  const y = useTransform(progress, range, dim === 1 ? ["0em", "0em"] : ["0.18em", "0em"]);
  return (
    <motion.span className="inline-block whitespace-pre" style={{ opacity, y }}>
      {children}{" "}
    </motion.span>
  );
}
