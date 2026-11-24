import Image from "next/image";
import { Star } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import type { Review } from "@/lib/types";
import { SectionHeading } from "./section-heading";

const fmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

/** Exibe somente avaliações reais cadastradas no painel. Sem avaliações, a seção não aparece. */
export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <section id="depoimentos" aria-labelledby="depoimentos-titulo" data-tone="#eef2f9" className="py-24 md:py-36">
      <div className="container-luxe">
        <div id="depoimentos-titulo">
          <SectionHeading
            index="05"
            eyebrow="Depoimentos"
            lines={["Palavras de quem", <em key="e" className="text-accent-deep">viveu a experiência.</em>]}
          />
        </div>
        <ul className="mt-16 grid gap-6 md:mt-20 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal as="li" key={r.id} delay={(i % 3) * 0.08}>
              <figure className="flex h-full flex-col bg-white p-8 transition-transform duration-700 hover:-translate-y-1 md:p-10">
                <div className="flex gap-1" aria-label={`Nota ${r.rating} de 5`} role="img">
                  {Array.from({ length: 5 }, (_, k) => (
                    <Star
                      key={k}
                      className={`h-3.5 w-3.5 ${k < r.rating ? "fill-accent-deep text-accent-deep" : "text-line"}`}
                      strokeWidth={1.25}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="mt-6 flex-1 font-serif text-[1.45rem] leading-snug text-ink">
                  “{r.comment}”
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-line pt-6">
                  {r.photo_url ? (
                    <span className="relative h-11 w-11 overflow-hidden rounded-full bg-sand">
                      <Image src={r.photo_url} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand font-serif text-lg">
                      {r.author_name.charAt(0)}
                    </span>
                  )}
                  <span>
                    <span className="block text-sm font-semibold">{r.author_name}</span>
                    <span className="block text-xs capitalize text-stone">
                      {fmt.format(new Date(`${r.review_date}T12:00:00Z`))}
                      {r.source ? ` · ${r.source}` : ""}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
