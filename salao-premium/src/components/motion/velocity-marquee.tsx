"use client";

import {
  motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity,
} from "motion/react";
import { useRef } from "react";

const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

/**
 * Faixa de texto infinita: desliza sozinha e acelera/inverte com a
 * velocidade da rolagem, inclinando levemente — sensação de continuidade.
 */
export function VelocityMarquee({ items, baseVelocity = -2.2, className = "" }: { items: string[]; baseVelocity?: number; className?: string }) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(velocity, [-2000, 0, 2000], [-4, 0, 4], { clamp: false });
  const skew = useTransform(velocity, [-2500, 0, 2500], [7, 0, -7]);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = dir.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    move += dir.current * move * f;
    baseX.set(baseX.get() + move);
  });

  const row = (
    <>
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-[0.45em] pr-[0.45em]">
          <span>{t}</span>
          <span aria-hidden="true" className="inline-block h-[0.12em] w-[0.12em] rotate-45 bg-accent-deep" />
        </span>
      ))}
    </>
  );

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-label={items.join(", ")} role="marquee">
      <motion.div className="flex w-max" style={{ x, skewX: skew }} aria-hidden="true">
        {row}{row}{row}{row}
      </motion.div>
    </div>
  );
}
