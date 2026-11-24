"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Reveal, RevealLines } from "@/components/ui/reveal";
import type { GalleryImage } from "@/lib/types";

// Padrão editorial assimétrico (repete a cada 6 imagens)
const SPANS = [
  "md:col-span-7 md:row-span-2 aspect-[4/5] md:aspect-auto",
  "md:col-span-5 aspect-[4/3]",
  "md:col-span-5 aspect-[4/3]",
  "md:col-span-4 aspect-[3/4]",
  "md:col-span-4 aspect-[3/4] md:translate-y-12",
  "md:col-span-4 aspect-[3/4]",
];

export function GallerySection({ images, instagramUrl }: { images: GalleryImage[]; instagramUrl: string | null }) {
  const categories = useMemo(
    () => [...new Set(images.map((i) => i.category).filter(Boolean))] as string[],
    [images],
  );
  const [filter, setFilter] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const visible = filter ? images.filter((i) => i.category === filter) : images;

  const close = useCallback(() => setActive(null), []);
  const go = useCallback(
    (dir: 1 | -1) => setActive((i) => (i === null ? i : (i + dir + visible.length) % visible.length)),
    [visible.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close, go]);

  return (
    <section id="galeria" aria-labelledby="galeria-titulo" data-tone="#ffffff" className="py-24 md:py-36">
      <div className="container-luxe">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <p className="eyebrow flex items-center gap-4 text-champagne-deep">
                <span>03</span>
                <span className="h-px w-10 bg-champagne-deep/50" aria-hidden="true" />
                <span className="text-stone">Galeria</span>
              </p>
            </Reveal>
            <div id="galeria-titulo">
              <RevealLines
                className="mt-6 text-[clamp(2.4rem,5.6vw,4.6rem)] font-light leading-[1]"
                lines={["Um portfólio", <em key="e" className="text-champagne-deep">de transformações.</em>]}
              />
            </div>
          </div>
          {categories.length > 1 ? (
            <Reveal delay={0.15}>
              <div role="tablist" aria-label="Filtrar por categoria" className="flex flex-wrap gap-2">
                {[null, ...categories].map((c) => (
                  <button
                    key={c ?? "all"}
                    role="tab"
                    aria-selected={filter === c}
                    onClick={() => setFilter(c)}
                    className={`min-h-10 border px-4 text-[0.66rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-500 ${
                      filter === c ? "border-ink bg-ink text-white" : "border-line text-stone hover:border-ink hover:text-ink"
                    }`}
                  >
                    {c ?? "Todos"}
                  </button>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>

        {images.length === 0 ? (
          <div className="mt-16 flex flex-col items-start gap-6 border-t border-line pt-10 md:flex-row md:items-center md:justify-between">
            <p className="max-w-lg text-stone">
              Nosso portfólio está sendo preparado com fotografias dos trabalhos realizados no salão.
            </p>
            {instagramUrl ? (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                Ver no Instagram
              </a>
            ) : null}
          </div>
        ) : (
          <motion.ul layout className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-20 md:grid-cols-12 md:gap-6">
            <AnimatePresence mode="popLayout">
              {visible.map((img, i) => (
                <motion.li
                  layout
                  key={img.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.9, delay: (i % 3) * 0.06 }}
                  className={`relative ${SPANS[i % SPANS.length]}`}
                >
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="group relative block h-full w-full overflow-hidden bg-sand"
                    aria-label={`Ampliar imagem${img.alt ? `: ${img.alt}` : ""}`}
                  >
                    <Image
                      src={img.image_url}
                      alt={img.alt}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    />
                    <span className="absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/15" />
                    {img.category ? (
                      <span className="eyebrow absolute bottom-4 left-4 translate-y-2 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        {img.category}
                      </span>
                    ) : null}
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      <AnimatePresence>
        {active !== null && visible[active] ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Visualização da imagem"
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              key={visible[active].id}
              className="relative h-[82vh] w-full max-w-5xl"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={visible[active].image_url}
                alt={visible[active].alt}
                fill
                sizes="100vw"
                quality={90}
                className="object-contain"
              />
            </motion.div>
            <button
              onClick={close}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center text-white/80 hover:text-white"
            >
              <X strokeWidth={1.25} />
            </button>
            {visible.length > 1 ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  aria-label="Imagem anterior"
                  className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white/70 hover:text-white md:left-6"
                >
                  <ChevronLeft strokeWidth={1.25} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  aria-label="Próxima imagem"
                  className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white/70 hover:text-white md:right-6"
                >
                  <ChevronRight strokeWidth={1.25} />
                </button>
                <p className="eyebrow absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60">
                  {active + 1} / {visible.length}
                </p>
              </>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
