import Link from "next/link";
import { ParallaxFrame } from "@/components/motion/parallax-media";
import { ScrollWords } from "@/components/motion/scroll-words";
import { Media } from "@/components/ui/media";
import { Reveal, RevealLines } from "@/components/ui/reveal";

const PILLARS = [
  { title: "Técnica", text: "Formação contínua e domínio das técnicas mais atuais de corte, cor e tratamento." },
  { title: "Cuidado", text: "Diagnóstico atento da fibra capilar e produtos escolhidos para a saúde dos seus fios." },
  { title: "Sofisticação", text: "Um ambiente acolhedor e reservado, para que o seu tempo aqui seja só seu." },
];

export function AboutSection({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  return (
    <section id="sobre" aria-labelledby="sobre-titulo" data-tone="#ffffff" className="overflow-hidden py-24 md:py-36">
      <div className="container-luxe grid gap-14 md:grid-cols-12 md:gap-10">
        <div className="relative md:col-span-6">
          <ParallaxFrame className="aspect-[4/5] md:aspect-[5/6]" strength={10}>
            <Media
              src={imageUrl}
              alt={`Ambiente do ${name}`}
              seed="about-aurea"
              tone="sand"
              sizes="(min-width: 768px) 46vw, 92vw"
              className="h-full w-full"
            />
          </ParallaxFrame>
          <Reveal
            delay={0.25}
            className="absolute -bottom-8 right-0 hidden w-[42%] border-[10px] border-white md:block lg:-right-10"
          >
            <ParallaxFrame className="aspect-square" strength={16} from="left">
              <Media src={null} alt="" seed="about-detail" tone="ink" className="h-full w-full" />
            </ParallaxFrame>
          </Reveal>
        </div>

        <div className="flex flex-col justify-center md:col-span-5 md:col-start-8">
          <div id="sobre-titulo">
            <RevealLines
              className="text-[clamp(2.4rem,5vw,4.2rem)] font-light uppercase leading-[1]"
              lines={["Mais do que beleza.", "Uma experiência."]}
            />
          </div>
          <ScrollWords
            className="mt-8 text-xl leading-relaxed text-ink md:text-[1.35rem]"
            text="Cada detalhe importa. Nosso propósito é proporcionar uma experiência única, unindo técnica, cuidado e sofisticação para valorizar a beleza e a personalidade de cada cliente."
          />
          <ul className="mt-12 divide-y divide-line border-y border-line">
            {PILLARS.map((p, i) => (
              <Reveal as="li" key={p.title} delay={0.06 + i * 0.06} className="grid gap-1 py-6 sm:grid-cols-[9.5rem_1fr] sm:gap-6">
                <h3 className="text-2xl leading-tight">{p.title}</h3>
                <p className="text-sm leading-relaxed text-stone sm:pt-1">{p.text}</p>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.2}>
            <Link href="/#profissionais" className="btn btn-outline mt-10">
              Conheça a equipe
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
