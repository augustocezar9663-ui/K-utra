"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ExpandPanel } from "@/components/motion/expand-panel";
import { useLenis } from "@/components/motion/smooth-scroll";
import { Reveal, RevealLines } from "@/components/ui/reveal";
import type { GalleryImage } from "@/lib/types";

// Grade editorial para fotos verticais (celular): colunas alternadas
// deslocadas para baixo criam ritmo sem cortar os retratos.
const OFFSET = ["", "translate-y-8 md:translate-y-16", "md:translate-y-6", "translate-y-8 md:translate-y-24"];

export function GallerySection({ images, instagramUrl }: { images: GalleryImage[]; instagramUrl: string | null }) {
  const categories = useMemo(() => [...new Set(images.map((i) => i.category).filter(Boolean))] as string[], [images]);
  const [filter, setFilter] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const visible = filter ? images.filter((i) => i.category === filter) : images;

  const lenis = useLenis();
  // o lightbox vai para o <body>: dentro do painel (isolate) ele ficaria
  // abaixo do header e do botão de WhatsApp
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
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
    // o Lenis rola a página via JS e ignora o overflow do body
    lenis?.stop();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close, go, lenis]);

  return (
    <ExpandPanel
      id="galeria"
      aria-labelledby="galeria-titulo"
      data-tone="#ffffff"
      data-header-tone="#07090f"
      className="py-20 text-white md:py-28"
    >
      <div className="container-luxe">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div id="galeria-titulo">
              <RevealLines
                className="text-[clamp(2.4rem,5.6vw,4.6rem)] font-light leading-[1] text-white"
                lines={["Um portfólio", "de transformações."]}
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
                    className={`min-h-10 border px-4 text-sm font-medium transition-colors duration-200 ${
                      filter === c
                        ? "border-white bg-white text-ink"
                        : "border-white/25 text-white/75 hover:border-white hover:text-white"
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
          <div className="mt-16 flex flex-col items-start gap-6 border-t border-white/15 pt-10 md:flex-row md:items-center md:justify-between">
            <p className="max-w-lg text-white/70">
              Nosso portfólio está sendo preparado com fotografias dos trabalhos realizados no salão.
            </p>
            {instagramUrl ? (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light">
                Ver no Instagram
              </a>
            ) : null}
          </div>
        ) : (
          <motion.ul
            layout
            className="mt-12 grid grid-cols-2 gap-3 pb-8 sm:gap-4 md:mt-16 md:grid-cols-4 md:gap-5 md:pb-24"
          >
            <AnimatePresence mode="popLayout">
              {visible.map((img, i) => (
                <motion.li
                  layout
                  key={img.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.75, delay: (i % 4) * 0.06 }}
                  className={`relative aspect-[3/5] ${OFFSET[i % OFFSET.length]}`}
                >
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="group relative block h-full w-full overflow-hidden bg-white/5"
                    aria-label={`Ampliar foto${img.alt ? `: ${img.alt}` : ""}`}
                  >
                    <Image
                      src={img.image_url}
                      alt={img.alt}
                      fill
                      sizes="(min-width: 768px) 24vw, 48vw"
                      quality={80}
                      className="object-cover object-[50%_40%] transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/60 to-transparent transition-opacity duration-300 ease-out group-hover:opacity-90"
                    />
                    {img.category ? (
                      <span className="label absolute bottom-3 left-3 text-white sm:bottom-4 sm:left-4">
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

      {mounted
        ? createPortal(
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
                    className="relative h-[78vh] w-full max-w-5xl"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
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
                      <p className="label absolute bottom-6 left-1/2 w-[min(90vw,40rem)] -translate-x-1/2 text-center text-white/80">
                        {visible[active].alt ? <span className="block text-white">{visible[active].alt}</span> : null}
                        <span className="tabular-nums text-white/60">
                          {active + 1} / {visible.length}
                        </span>
                      </p>
                    </>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </ExpandPanel>
  );
}

const noopSubscribe = () => () => {};
