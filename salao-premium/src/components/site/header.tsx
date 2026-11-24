"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLenis } from "@/components/motion/smooth-scroll";
import { NAV_LINKS } from "@/lib/nav";
import { Brand } from "./brand";


export function Header({ name, tagline, logoUrl }: { name: string; tagline: string; logoUrl: string | null }) {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(overHero);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
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
      // tom da seção sob o header (vidro claro ou escuro)
      const probe = 40;
      const sec = [...document.querySelectorAll<HTMLElement>("[data-tone]")].find((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom > probe;
      });
      if (sec) {
        const h = sec.dataset.tone!.replace("#", "");
        const n = parseInt(h, 16);
        const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
        setDark(lum < 0.45);
      } else setDark(false);
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
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        } ${
          solid && !open
            ? dark
              ? "bg-[#0d0c0b]/55 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl backdrop-saturate-150"
              : "bg-white/75 shadow-[0_1px_0_rgba(17,17,17,0.06)] backdrop-blur-xl backdrop-saturate-150"
            : "bg-transparent"
        }`}
      >
        <div
          className={`container-luxe flex items-center justify-between transition-[height] duration-700 ${
            solid ? "h-[72px]" : "h-[88px]"
          }`}
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
                    className={`link-underline pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] transition-colors duration-500 ${
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
              className={`btn hidden min-h-11 px-6 sm:inline-flex ${light ? "btn-champagne" : "btn-primary"}`}
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
                  className={`absolute left-0 top-0 h-px w-full transition-all duration-500 ${
                    light ? "bg-white" : "bg-ink"
                  } ${open ? "top-1.5 rotate-45" : ""}`}
                />
                <span
                  className={`absolute bottom-0 left-0 h-px transition-all duration-500 ${light ? "bg-white" : "bg-ink"} ${
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
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav aria-label="Menu móvel" className="container-luxe flex flex-1 flex-col justify-center pt-24">
              <ul className="space-y-2">
                {NAV_LINKS.map((l, i) => (
                  <li key={l.href} className="overflow-hidden">
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: "0%" }}
                      transition={{ duration: 0.8, delay: 0.25 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="flex items-baseline gap-4 py-2 font-serif text-[2.6rem] leading-tight text-ink"
                      >
                        <span className="eyebrow text-champagne-deep">0{i + 1}</span>
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
              transition={{ delay: 0.7, duration: 0.6 }}
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
