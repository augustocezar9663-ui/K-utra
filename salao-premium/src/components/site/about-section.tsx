import { ScrollWords } from "@/components/motion/scroll-words";
import { Reveal, RevealLines } from "@/components/ui/reveal";

const PILLARS = [
  { title: "Técnica", text: "Formação contínua e domínio das técnicas mais atuais de corte, cor e tratamento." },
  { title: "Cuidado", text: "Diagnóstico atento da fibra capilar e produtos escolhidos para a saúde dos seus fios." },
  { title: "Sofisticação", text: "Um ambiente acolhedor e reservado, para que o seu tempo aqui seja só seu." },
];

export function AboutSection() {
  return (
    <section id="sobre" aria-labelledby="sobre-titulo" data-tone="#ffffff" className="py-20 md:py-28">
      <div className="container-luxe grid gap-10 lg:grid-cols-12">
        <div id="sobre-titulo" className="lg:col-span-5">
          <RevealLines
            className="text-[clamp(2.4rem,5vw,4.2rem)] font-light uppercase leading-[1]"
            lines={["Mais do que beleza.", "Uma experiência."]}
          />
        </div>
        <div className="lg:col-span-7">
          <ScrollWords
            className="text-xl leading-relaxed text-ink md:text-[1.35rem]"
            text="Cada detalhe importa. Nosso propósito é proporcionar uma experiência única, unindo técnica, cuidado e sofisticação para valorizar a beleza e a personalidade de cada cliente."
          />
          <ul className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Reveal as="li" key={p.title} delay={0.06 + i * 0.06}>
                <h3 className="text-2xl leading-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone">{p.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
