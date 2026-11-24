import Link from "next/link";
import { Reveal, RevealLines } from "@/components/ui/reveal";

export function CtaBand() {
  return (
    <section aria-label="Agende" data-tone="#d6c1a3" className="relative z-10 overflow-hidden bg-champagne py-24 md:py-32">
      <div className="container-luxe flex flex-col items-start gap-10 md:flex-row md:items-end md:justify-between">
        <RevealLines
          className="text-[clamp(2.4rem,6vw,5rem)] font-light leading-[0.98] text-ink"
          lines={["Reserve o seu", <em key="e">momento.</em>]}
        />
        <Reveal delay={0.2} className="flex flex-col gap-4 md:items-end">
          <p className="max-w-sm text-ink/70 md:text-right">
            Escolha o serviço, o profissional e o horário ideal em poucos passos.
          </p>
          <Link href="/agendar" className="btn btn-primary">
            Agendar experiência
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
