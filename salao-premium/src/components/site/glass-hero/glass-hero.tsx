"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Artwork } from "@/components/ui/artwork";
import type { GlassHeroHandle, HeroCopy, HeroLayout, HoverKey, TextItem } from "./engine";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Hero de vidro estilhaçado. Enquanto o WebGL não está pronto (ou quando o
 * usuário prefere movimento reduzido / não há WebGL), mostra a versão
 * estática renderizada no servidor — o mesmo conteúdo, com SEO completo.
 */
export function GlassHero({ name, city, imageUrl }: { name: string; city: string | null; imageUrl: string | null }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GlassHeroHandle | null>(null);
  const reduce = useReducedMotion();
  const [engineMode, setMode] = useState<"pending" | "gl" | "static">("pending");
  const mode = reduce ? "static" : engineMode;
  const [layout, setLayout] = useState<HeroLayout | null>(null);

  const copy: HeroCopy = {
    eyebrow: `${name}${city ? ` · ${city}` : ""}`.toUpperCase(),
    lines: [{ text: "SEU ESTILO." }, { text: "Sua identidade.", italic: true }, { text: "NOSSO CUIDADO." }],
    sub: ["Uma experiência de beleza exclusiva, pensada para valorizar", "sua personalidade e transformar seu visual."],
    primary: "AGENDAR EXPERIÊNCIA",
    secondary: "CONHECER SERVIÇOS",
    footLeft: "HAIR ATELIER",
    footRight: "ROLE PARA DESCOBRIR",
  };
  const copyKey = copy.eyebrow;

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => engineRef.current?.setScroll(v));

  useEffect(() => {
    if (reduce) return;
    let disposed = false;
    import("./engine")
      .then(({ createGlassHero, webglAvailable }) => {
        if (disposed || !canvasRef.current || !layerRef.current) return;
        if (!webglAvailable()) return setMode("static");
        const css = getComputedStyle(document.documentElement);
        const serif = css.getPropertyValue("--font-cormorant").trim() || "Georgia, serif";
        const sans = css.getPropertyValue("--font-manrope").trim() || "system-ui, sans-serif";
        try {
          engineRef.current = createGlassHero({
            canvas: canvasRef.current,
            layer: layerRef.current,
            copy,
            fonts: { serif, sans },
            onLayout: (l) => setLayout({ ...l, items: l.items.map((it) => ({ ...it })) }),
          });
          engineRef.current.setScroll(scrollYProgress.get());
          setMode("gl");
        } catch {
          setMode("static");
        }
      })
      .catch(() => setMode("static"));
    return () => {
      disposed = true;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, copyKey]);

  const hoverProps = (k: HoverKey) => ({
    onPointerEnter: () => engineRef.current?.setHover(k),
    onPointerLeave: () => engineRef.current?.setHover(null),
    onFocus: () => engineRef.current?.setHover(k),
    onBlur: () => engineRef.current?.setHover(null),
  });

  const textStyle = (it: TextItem): React.CSSProperties => ({
    left: it.align === "right" ? undefined : it.x,
    right: it.align === "right" && layout ? layout.w - it.x : undefined,
    top: it.y,
    fontSize: it.size,
    fontWeight: it.weight,
    fontStyle: it.italic ? "italic" : "normal",
    letterSpacing: `${it.tracking}em`,
    lineHeight: it.lineHeight,
    fontFamily: it.serif ? "var(--font-cormorant)" : "var(--font-manrope)",
  });

  return (
    <section
      id="inicio"
      ref={sectionRef}
      aria-label="Apresentação"
      className="relative h-[185svh] motion-reduce:h-[100svh]"
    >
      {/* marcador de tom: o fundo começa a clarear antes do fim da hero,
          enquanto os serviços sobem por cima dos últimos cacos */}
      <div aria-hidden="true" data-tone="#0d0c0b" className="pointer-events-none absolute inset-x-0 top-0 h-[160svh] lg:h-[130svh] motion-reduce:h-[100svh]" />
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* WebGL */}
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full motion-reduce:hidden" />

        {/* Texto real, transparente, mapeado sobre o vidro (seleção + cliques) */}
        <div
          ref={layerRef}
          className="glass-text absolute left-0 top-0 origin-top-left"
          style={{ width: layout?.w, height: layout?.h, visibility: "hidden" }}
        >
          {mode === "gl" && layout ? (
            <>
              <p style={textStyle(layout.items.find((i) => i.key === "eyebrow")!)} className="pl-[4.4em]">
                {copy.eyebrow}
              </p>
              <h1>
                {layout.items
                  .filter((i) => i.role === "h1")
                  .map((it) => (
                    <span key={it.key} style={textStyle(it)}>
                      {it.text}{" "}
                    </span>
                  ))}
              </h1>
              {layout.items
                .filter((i) => i.key.startsWith("s"))
                .map((it) => (
                  <p key={it.key} style={textStyle(it)}>
                    {it.text}
                  </p>
                ))}
              {(() => {
                const p = layout.items.find((i) => i.key === "primary")!;
                const s = layout.items.find((i) => i.key === "secondary")!;
                return (
                  <>
                    <Link
                      href="/agendar"
                      className="glass-hit"
                      style={{ ...textStyle(p), width: p.w, height: p.h }}
                      {...hoverProps("primary")}
                    >
                      {p.text}
                    </Link>
                    <a
                      href="#servicos"
                      className="glass-hit"
                      style={{ ...textStyle(s), width: (s.w ?? 200) + 8, height: s.h }}
                      {...hoverProps("secondary")}
                    >
                      {s.text}
                    </a>
                  </>
                );
              })()}
              {layout.items
                .filter((i) => i.role === "small")
                .map((it) => (
                  <small key={it.key} style={textStyle(it)}>
                    {it.text}
                  </small>
                ))}
            </>
          ) : null}
        </div>

        {/* Fallback estático (SSR, movimento reduzido, sem WebGL) */}
        <AnimatePresence>
          {mode !== "gl" ? (
            <motion.div
              key="static"
              className="absolute inset-0"
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <StaticHero imageUrl={imageUrl} name={name} city={city} progress={scrollYProgress} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function StaticHero({
  imageUrl,
  name,
  city,
  progress,
}: {
  imageUrl: string | null;
  name: string;
  city: string | null;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const reduce = useReducedMotion();
  const scale = useTransform(progress, [0, 1], [1, reduce ? 1 : 0.86]);
  const opacity = useTransform(progress, [0, 0.7], [1, reduce ? 1 : 0]);
  const radius = useTransform(progress, [0, 1], [0, reduce ? 0 : 36]);
  return (
    <motion.div
      className="absolute inset-0 flex items-end overflow-hidden bg-ink text-white"
      style={{ scale, opacity, borderRadius: radius }}
      initial={false}
    >
      <div className="absolute inset-0">
        {imageUrl ? (
          <Image src={imageUrl} alt={`Ambiente do ${name}`} fill preload sizes="100vw" quality={80} className="object-cover" />
        ) : (
          <Artwork seed="hero-aurea" tone="ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/30" />
      </div>
      <div className="container-luxe relative w-full pb-16 pt-36 md:pb-24">
        <p className="eyebrow mb-8 flex items-center gap-4 text-champagne">
          <span className="h-px w-10 bg-champagne" aria-hidden="true" />
          {name}
          {city ? ` · ${city}` : ""}
        </p>
        <h1 className="max-w-5xl text-[clamp(2.9rem,9vw,7.6rem)] font-light uppercase leading-[0.92] tracking-[-0.015em]">
          <span className="block">Seu estilo.</span>
          <span className="block italic normal-case text-champagne">Sua identidade.</span>
          <span className="block">Nosso cuidado.</span>
        </h1>
        <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:items-end">
          <p className="max-w-md text-base leading-relaxed text-white/75 md:col-span-5 md:text-lg">
            Uma experiência de beleza exclusiva, pensada para valorizar sua personalidade e transformar seu visual.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row md:col-span-7 md:justify-end">
            <Link href="/agendar" className="btn btn-champagne">
              Agendar experiência
            </Link>
            <a href="#servicos" className="btn btn-ghost-light">
              Conhecer serviços
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
