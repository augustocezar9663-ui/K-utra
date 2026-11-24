"use client";

import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ParallaxFrame } from "@/components/motion/parallax-media";
import { Media } from "@/components/ui/media";
import { Reveal, RevealLines } from "@/components/ui/reveal";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";

const TONES = ["ink", "sand", "champagne", "cream"] as const;

/**
 * Serviços. No desktop a seção "prende" na tela e a rolagem vertical
 * desliza a trilha de cards na horizontal — o site continua andando sem
 * cortes. Em telas menores (ou com movimento reduzido) vira uma grade.
 */
export function ServicesSection({ services }: { services: Service[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [distance, setDistance] = useState(0);
  const [index, setIndex] = useState(1);

  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px) and (min-height: 640px)");
    const update = () => setPinned(mq.matches && !reduce && services.length > 2);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduce, services.length]);

  useEffect(() => {
    if (!pinned || !trackRef.current) return;
    const el = trackRef.current;
    const measure = () => setDistance(Math.max(0, el.scrollWidth - innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    addEventListener("resize", measure);
    return () => { ro.disconnect(); removeEventListener("resize", measure); };
  }, [pinned]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.35 });
  const x = useTransform(smooth, [0, 1], [0, -distance]);
  const imgX = useTransform(smooth, [0, 1], ["-6.5%", "6.5%"]);
  const bar = useTransform(smooth, [0, 1], [0.06, 1]);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setIndex(Math.min(services.length, Math.max(1, Math.round(v * (services.length - 1)) + 1)));
  });

  // teclado: o foco num card fora da tela rola a página até a posição da
  // trilha em que ele aparece (overflow-clip impede o navegador de deslocar
  // o contêiner por conta própria e dessincronizar a trilha)
  const onTrackFocus = (e: React.FocusEvent<HTMLUListElement>) => {
    const section = sectionRef.current, track = trackRef.current;
    const li = (e.target as HTMLElement).closest("li");
    if (!section || !track || !li || distance <= 0) return;
    const want = Math.min(distance, Math.max(0, li.offsetLeft - innerWidth * 0.3));
    const top = section.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: top + want, behavior: "instant" as ScrollBehavior });
  };

  const heading = (
    <div className={pinned ? "flex w-[min(34vw,520px)] shrink-0 flex-col justify-center pr-10" : ""}>
      <Reveal>
        <p className="eyebrow flex items-center gap-4 text-champagne-deep">
          <span>01</span>
          <span className="h-px w-10 bg-champagne-deep/50" aria-hidden="true" />
          <span className="text-stone">Serviços</span>
        </p>
      </Reveal>
      <RevealLines
        className="mt-6 text-[clamp(2.4rem,5.2vw,4.6rem)] font-light leading-[1]"
        lines={["Rituais de beleza,", <em key="e" className="text-champagne-deep">sob medida.</em>]}
      />
      <Reveal delay={0.15}>
        <p className="mt-8 max-w-sm text-base leading-relaxed text-stone">
          Cada atendimento começa com uma conversa. Entendemos sua rotina, seu estilo e o que você deseja sentir ao se
          olhar no espelho.
        </p>
      </Reveal>
      {pinned ? (
        <div className="mt-12 flex items-center gap-5" aria-hidden="true">
          <span className="font-serif text-3xl tabular-nums">{String(index).padStart(2, "0")}</span>
          <span className="relative h-px w-32 bg-line">
            <motion.span className="absolute inset-0 origin-left bg-ink" style={{ scaleX: bar }} />
          </span>
          <span className="text-sm text-stone tabular-nums">{String(services.length).padStart(2, "0")}</span>
        </div>
      ) : null}
    </div>
  );

  if (services.length === 0) {
    return (
      <section id="servicos" ref={sectionRef} data-tone="#f7f5f2" className="py-24 md:py-36">
        <div className="container-luxe">
          {heading}
          <p className="mt-16 border-t border-line pt-10 text-stone">
            Os serviços estão sendo atualizados. Fale conosco pelo WhatsApp para mais informações.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="servicos"
      ref={sectionRef}
      data-tone="#f7f5f2"
      aria-label="Serviços"
      className={`relative z-10 -mt-[25svh] motion-reduce:mt-0 ${pinned ? "lg:-mt-[55svh]" : "py-24 md:py-36"}`}
      style={pinned ? { height: `calc(100svh + ${distance}px)` } : undefined}
    >
      <div className={pinned ? "sticky top-0 flex h-[100svh] items-center overflow-clip" : "container-luxe"}>
        {!pinned ? heading : null}
        <motion.ul
          ref={trackRef}
          style={pinned ? { x } : undefined}
          onFocus={pinned ? onTrackFocus : undefined}
          className={
            pinned
              ? "flex items-center gap-7 pl-[max(1.25rem,calc((100vw-1320px)/2+2.5rem))] pr-[8vw] will-change-transform"
              : "mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 md:mt-24 lg:grid-cols-3"
          }
        >
          {pinned ? <li className="contents">{heading}</li> : null}
          {services.map((s, i) => (
            <li key={s.id} className={pinned ? "w-[clamp(280px,23vw,380px)] shrink-0" : ""}>
              <article className="group flex h-full flex-col">
                <Link href={`/agendar?servico=${s.slug}`} className="block" aria-label={`Agendar ${s.name}`} tabIndex={-1} data-cursor="link">
                  {pinned ? (
                    <div className="relative h-[52svh] overflow-hidden bg-sand">
                      <motion.div className="absolute inset-y-0 -inset-x-[8%]" style={{ x: imgX }}>
                        <Media
                          src={s.image_url}
                          alt={s.name}
                          seed={s.slug}
                          tone={TONES[i % TONES.length]}
                          sizes="380px"
                          className="h-full w-full"
                          imgClassName="transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                          label={s.image_url ? undefined : s.category ?? undefined}
                        />
                      </motion.div>
                    </div>
                  ) : (
                    <ParallaxFrame className="aspect-[4/5] bg-sand">
                      <Media
                        src={s.image_url}
                        alt={s.name}
                        seed={s.slug}
                        tone={TONES[i % TONES.length]}
                        sizes="(min-width: 640px) 45vw, 92vw"
                        className="h-full w-full"
                        label={s.image_url ? undefined : s.category ?? undefined}
                      />
                    </ParallaxFrame>
                  )}
                </Link>
                <div className="flex flex-1 flex-col border-b border-line pb-6 pt-5 transition-colors duration-500 group-hover:border-ink">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[1.75rem] leading-tight">{s.name}</h3>
                    <span className="eyebrow shrink-0 text-stone">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  {s.description ? (
                    <p className="mt-2 line-clamp-2 text-[0.92rem] leading-relaxed text-stone">{s.description}</p>
                  ) : null}
                  <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                    <div className="text-sm">
                      <p className="flex items-center gap-2 text-stone">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        {formatDuration(s.duration_minutes)}
                      </p>
                      <p className="mt-1 font-serif text-2xl text-ink">
                        {s.price_from ? <span className="mr-1 font-sans text-xs text-stone">a partir de</span> : null}
                        {formatPrice(s.price_cents)}
                      </p>
                    </div>
                    <Link
                      href={`/agendar?servico=${s.slug}`}
                      className="group/link flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
                    >
                      <span className="link-underline pb-1">Agendar</span>
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform duration-500 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
