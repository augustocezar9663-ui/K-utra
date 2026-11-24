"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLenis } from "@/components/motion/smooth-scroll";
import { NAV_LINKS } from "@/lib/nav";
import { DUR, EASE_DRAWER, EASE_OUT } from "@/lib/motion";
import { useHeaderDark } from "@/lib/tone-store";
import { Brand } from "./brand";


export function Header({ name, tagline, logoUrl }: { name: string; tagline: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const dark = useHeaderDark(overHero);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    // só lê scrollY (sem leituras de layout); o tom sob o header vem do ScrollTone
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      // some ao descer, volta ao subir (rolagem contínua sem distração)
      if (Math.abs(y - last) > 6) {
        const focusInside = document.activeElement?.closest("header") != null;
        setHidden(y > last && y > 160 && !focusInside);
        last = y;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) lenis?.stop(); else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lenis]);

  const solid = scrolled || !overHero;
  const light = (!solid || dark) && !open;

  return (
    <>
      <header
        onFocus={() => setHidden(false)}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,transform] duration-[420ms] ease-out ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        } ${
          solid && !open
            ? dark
              ? "bg-[#05070c]/70 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
              : "bg-white/80 shadow-[0_1px_0_rgba(17,17,17,0.06)] backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div
          className="container-luxe flex h-[76px] items-center justify-between md:h-[84px]"
        >
          <Link href="/" aria-label={`${name} — página inicial`} className="relative z-10" onClick={() => setOpen(false)}>
            <Brand name={name} tagline={tagline} logoUrl={logoUrl} light={light} />
          </Link>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`link-underline pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] transition-colors duration-200 ${
                      light ? "text-white/85 hover:text-white" : "text-ink/75 hover:text-ink"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="relative z-10 flex items-center gap-3">
            <Link
              href="/agendar"
              className={`btn hidden min-h-11 px-6 sm:inline-flex ${light ? "btn-accent" : "btn-primary"}`}
            >
              Agendar horário
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              className="flex h-11 w-11 items-center justify-center lg:hidden"
            >
              <span className="relative block h-3 w-7">
                <span
                  className={`absolute left-0 top-0 h-px w-full transition-[top,transform,background-color] duration-300 ease-out ${
                    light ? "bg-white" : "bg-ink"
                  } ${open ? "top-1.5 rotate-45" : ""}`}
                />
                <span
                  className={`absolute bottom-0 left-0 h-px transition-[bottom,width,transform,background-color] duration-300 ease-out ${light ? "bg-white" : "bg-ink"} ${
                    open ? "bottom-1.5 w-full -rotate-45" : "w-2/3"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-40 flex flex-col bg-cream lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: DUR.drawer, ease: EASE_DRAWER }}
          >
            <nav aria-label="Menu móvel" className="container-luxe flex flex-1 flex-col justify-center pt-24">
              <ul className="space-y-2">
                {NAV_LINKS.map((l, i) => (
                  <li key={l.href} className="overflow-hidden">
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: "0%" }}
                      transition={{ duration: 0.5, delay: 0.12 + i * 0.04, ease: EASE_OUT }}
                    >
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="block py-2 font-serif text-[2.6rem] leading-tight text-ink"
                      >
                        {l.label}
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </nav>
            <motion.div
              className="container-luxe pb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4, ease: EASE_OUT }}
            >
              <Link href="/agendar" onClick={() => setOpen(false)} className="btn btn-primary w-full">
                Agendar horário
              </Link>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
