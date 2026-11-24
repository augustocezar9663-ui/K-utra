import Link from "next/link";
import { ExpandPanel } from "@/components/motion/expand-panel";
import { ParallaxFrame } from "@/components/motion/parallax-media";
import { Media } from "@/components/ui/media";
import { Reveal } from "@/components/ui/reveal";
import type { ProfessionalWithServices } from "@/lib/types";
import { SectionHeading } from "./section-heading";

export function TeamSection({ professionals }: { professionals: ProfessionalWithServices[] }) {
  return (
    <ExpandPanel id="profissionais" aria-labelledby="equipe-titulo" data-tone="#0a1430" className="bg-ink py-24 text-white md:py-36">
      <div className="container-luxe">
        <div id="equipe-titulo">
          <SectionHeading
            light
            index="04"
            eyebrow="Profissionais"
            lines={["Mãos que entendem", <em key="e" className="text-accent">o seu estilo.</em>]}
            intro="Especialistas que unem sensibilidade artística e precisão técnica. Escolha quem vai cuidar de você ou deixe que encontremos a primeira disponibilidade."
          />
        </div>

        {professionals.length === 0 ? (
          <p className="mt-16 border-t border-white/10 pt-10 text-white/55">
            Nossa equipe será apresentada aqui em breve.
          </p>
        ) : (
          <ul className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:mt-24 lg:grid-cols-4">
            {professionals.map((p, i) => (
              <Reveal as="li" key={p.id} delay={(i % 4) * 0.08}>
                <article className="group">
                  <ParallaxFrame className="aspect-[3/4]" strength={7}>
                    <Media
                      src={p.photo_url}
                      alt={`Foto de ${p.name}`}
                      seed={p.slug}
                      tone={i % 2 ? "accent" : "sand"}
                      sizes="(min-width: 1024px) 23vw, (min-width: 640px) 45vw, 92vw"
                      className="h-full w-full"
                      imgClassName="grayscale-[35%] transition-[transform,filter] duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-hover:grayscale-0"
                    />
                  </ParallaxFrame>
                  <div className="pt-6">
                    {p.specialty ? <p className="eyebrow text-accent">{p.specialty}</p> : null}
                    <h3 className="mt-2 text-3xl">{p.name}</h3>
                    {p.bio ? <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/60">{p.bio}</p> : null}
                    <Link
                      href={`/agendar?profissional=${p.id}`}
                      className="link-underline mt-5 inline-block pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white"
                    >
                      Agendar com {p.name.split(" ")[0]}
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </ExpandPanel>
  );
}
