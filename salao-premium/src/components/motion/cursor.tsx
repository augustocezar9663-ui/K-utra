"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/lib/use-media-query";

/**
 * Cursor refinado (somente mouse/trackpad): um ponto que segue com leveza e
 * um anel que cresce sobre elementos interativos. Desligado em telas de
 * toque e para quem prefere movimento reduzido.
 */
export function LuxeCursor() {
  const enabled = useMediaQuery("(pointer: fine) and (prefers-reduced-motion: no-preference)");
  const [state, setState] = useState<"default" | "link" | "text" | "hidden">("hidden");
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-luxe-cursor");
    const move = (e: PointerEvent) => {
      x.set(e.clientX); y.set(e.clientY);
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [role=button], label, select, summary, [data-cursor=link]")) setState("link");
      else if (t.closest("input, textarea, [contenteditable]")) setState("text");
      else setState("default");
    };
    const leave = () => setState("hidden");
    addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-luxe-cursor");
    };
  }, [enabled, x, y]);

  if (!enabled) return null;
  const ring = state === "link" ? 56 : state === "text" ? 4 : 30;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[80] mix-blend-difference">
      <motion.div
        className="absolute left-0 top-0 rounded-full border border-white"
        style={{ x: rx, y: ry, translateX: "-50%", translateY: "-50%" }}
        animate={{ width: ring, height: state === "text" ? 26 : ring, opacity: state === "hidden" ? 0 : state === "text" ? 0.9 : 0.7, borderRadius: state === "text" ? 2 : 999 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      />
      <motion.div
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-white"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: state === "hidden" || state === "text" ? 0 : 1, scale: state === "link" ? 0 : 1 }}
      />
    </div>
  );
}
