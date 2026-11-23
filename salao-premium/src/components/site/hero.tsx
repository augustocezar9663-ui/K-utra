"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Artwork } from "@/components/ui/artwork";
import { RevealLines } from "@/components/ui/reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero({ imageUrl, name, city }: { imageUrl: string | null; name: string; city: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  return (
    <section
      id="inicio"
      ref={ref}
      aria-label="Apresentação"
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-ink text-white"
    >
      <motion.div className="absolute inset-0 -z-10" style={{ y }}>
        <motion.div
          className="absolute inset-0"
          initial={{ scale: reduce ? 1 : 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.6, ease: EASE }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`Ambiente do ${name}`}
              fill
              preload
              sizes="100vw"
              quality={80}
              className="object-cover"
            />
          ) : (
            <Artwork seed="hero-aurea" tone="ink" />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/20 to-transparent" />
      </motion.div>

      <motion.div style={{ opacity: fade }} className="container-luxe w-full pb-16 pt-36 md:pb-24">
        <motion.p
          className="eyebrow mb-8 flex items-center gap-4 text-champagne"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
        >
          <span className="h-px w-10 bg-champagne" aria-hidden="true" />
          {name}
          {city ? ` · ${city}` : ""}
        </motion.p>

        <RevealLines
          as="h1"
          animateOnMount
          delay={0.35}
          className="max-w-5xl text-[clamp(2.9rem,9vw,7.6rem)] font-light uppercase leading-[0.92] tracking-[-0.015em]"
          lines={[
            "Seu estilo.",
            <span key="2" className="italic text-champagne normal-case">
              Sua identidade.
            </span>,
            "Nosso cuidado.",
          ]}
        />

        <div className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:items-end">
          <motion.p
            className="max-w-md text-base leading-relaxed text-white/75 md:col-span-5 md:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.95, ease: EASE }}
          >
            Uma experiência de beleza exclusiva, pensada para valorizar sua personalidade e transformar seu visual.
          </motion.p>
          <motion.div
            className="flex flex-col gap-3 sm:flex-row md:col-span-7 md:justify-end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1, ease: EASE }}
          >
            <Link href="/agendar" className="btn btn-champagne">
              Agendar experiência
            </Link>
            <Link href="/#servicos" className="btn btn-ghost-light">
              Conhecer serviços
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        aria-hidden="true"
      >
        <span className="eyebrow text-[0.58rem] text-white/50">Role</span>
        <span className="relative h-12 w-px overflow-hidden bg-white/15">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-champagne"
            animate={reduce ? undefined : { y: ["-100%", "200%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
