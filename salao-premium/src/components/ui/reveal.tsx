"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { DUR, EASE_OUT as EASE } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article" | "span";
}

/** Fade-in + slide-up ao entrar na viewport (uma única vez). */
export function Reveal({ children, delay = 0, y = 20, className, as = "div" }: RevealProps) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: reduce ? 0.2 : DUR.reveal, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

/**
 * Revelação de título linha a linha, com máscara. O gatilho de viewport
 * fica no título (sempre visível) e propaga para as linhas via variants —
 * as linhas começam fora da máscara e nunca seriam "vistas" sozinhas.
 */
export function RevealLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  animateOnMount = false,
  as = "h2",
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  animateOnMount?: boolean;
  as?: "h1" | "h2" | "h3";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const trigger = animateOnMount
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } };
  return (
    <Tag className={className} initial="hidden" {...trigger}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className={`block ${lineClassName ?? ""}`}
            variants={{
              hidden: reduce ? { opacity: 0, y: "0%" } : { y: "105%", opacity: 1 },
              show: {
                y: "0%",
                opacity: 1,
                transition: { duration: reduce ? 0.2 : 0.9, delay: delay + i * 0.07, ease: EASE },
              },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
