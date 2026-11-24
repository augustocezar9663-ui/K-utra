import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealLines } from "@/components/ui/reveal";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";

/**
 * Serviços em formato de cardápio: título fixo à esquerda e a lista de
 * serviços à direita. Cada linha inteira leva ao agendamento já com o
 * serviço selecionado.
 */
export function ServicesSection({ services }: { services: Service[] }) {
  return (
    <section
      id="servicos"
      aria-labelledby="servicos-titulo"
      data-tone="#eef2f9"
      className="relative z-10 -mt-[55svh] py-20 motion-reduce:mt-0 md:py-28"
    >
      <div className="container-luxe grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <div id="servicos-titulo">
              <RevealLines
                className="text-[clamp(2.4rem,5.2vw,4.6rem)] font-light leading-[1]"
                lines={["Cortes e rituais", "sob medida."]}
              />
            </div>
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-sm text-base leading-relaxed text-stone">
                Cada atendimento começa com uma conversa. Entendemos sua rotina, seu estilo e o que você deseja sentir
                ao se olhar no espelho.
              </p>
            </Reveal>
          </div>
        </div>

        {services.length === 0 ? (
          <p className="border-t border-line pt-8 text-stone lg:col-span-7">
            Os serviços estão sendo atualizados. Fale conosco pelo WhatsApp para mais informações.
          </p>
        ) : (
          <ul className="border-t border-line lg:col-span-7">
            {services.map((s, i) => (
              <Reveal as="li" key={s.id} delay={Math.min(i, 5) * 0.04} className="border-b border-line">
                <Link
                  href={`/agendar?servico=${s.slug}`}
                  aria-label={`Agendar ${s.name}, ${formatDuration(s.duration_minutes)}, ${
                    s.price_from ? "a partir de " : ""
                  }${formatPrice(s.price_cents)}`}
                  data-cursor="link"
                  className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-5 md:py-6"
                >
                  <h3 className="text-[1.55rem] leading-tight transition-transform duration-300 ease-out group-hover:translate-x-1.5 md:text-[1.75rem]">
                    {s.name}
                  </h3>
                  <p className="whitespace-nowrap text-right font-serif text-xl md:text-2xl">
                    {s.price_from ? <span className="mr-1.5 font-sans text-xs text-stone">a partir de</span> : null}
                    {formatPrice(s.price_cents)}
                  </p>
                  <p className="line-clamp-1 text-sm leading-relaxed text-stone">
                    {formatDuration(s.duration_minutes)}
                    {s.description ? <span aria-hidden="true"> · </span> : null}
                    {s.description}
                  </p>
                  <span className="flex items-center justify-end gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em]">
                    Agendar
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
