import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { Media } from "@/components/ui/media";
import { Reveal } from "@/components/ui/reveal";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";
import { SectionHeading } from "./section-heading";

const TONES = ["ink", "sand", "champagne", "cream"] as const;

export function ServicesSection({ services }: { services: Service[] }) {
  return (
    <section id="servicos" aria-labelledby="servicos-titulo" className="bg-cream py-24 md:py-36">
      <div className="container-luxe">
        <div id="servicos-titulo">
          <SectionHeading
            index="01"
            eyebrow="Serviços"
            lines={["Rituais de beleza,", <em key="e" className="text-champagne-deep">sob medida.</em>]}
            intro="Cada atendimento começa com uma conversa. Entendemos sua rotina, seu estilo e o que você deseja sentir ao se olhar no espelho."
          />
        </div>

        {services.length === 0 ? (
          <p className="mt-16 border-t border-line pt-10 text-stone">
            Os serviços estão sendo atualizados. Fale conosco pelo WhatsApp para mais informações.
          </p>
        ) : (
          <ul className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 md:mt-24 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal as="li" key={s.id} delay={(i % 3) * 0.08}>
                <article className="group flex h-full flex-col">
                  <Link
                    href={`/agendar?servico=${s.slug}`}
                    className="block"
                    aria-label={`Agendar ${s.name}`}
                    tabIndex={-1}
                  >
                    <Media
                      src={s.image_url}
                      alt={s.name}
                      seed={s.slug}
                      tone={TONES[i % TONES.length]}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                      className="aspect-[4/5] bg-sand"
                      imgClassName="transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
                      label={s.image_url ? undefined : s.category ?? undefined}
                    />
                  </Link>
                  <div className="flex flex-1 flex-col border-b border-line pb-7 pt-6 transition-colors duration-500 group-hover:border-ink">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-[1.9rem] leading-tight">{s.name}</h3>
                      <span className="eyebrow shrink-0 text-stone">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    {s.description ? (
                      <p className="mt-3 text-[0.95rem] leading-relaxed text-stone">{s.description}</p>
                    ) : null}
                    <div className="mt-auto flex items-end justify-between gap-4 pt-6">
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
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
