import { Reveal, RevealLines } from "@/components/ui/reveal";

/**
 * Título de seção. Sem rótulo numerado acima: o título carrega a seção
 * sozinho (a navegação já nomeia as áreas do site).
 */
export function SectionHeading({
  lines,
  intro,
  light = false,
  align = "split",
}: {
  lines: React.ReactNode[];
  intro?: string;
  light?: boolean;
  align?: "split" | "stack";
}) {
  return (
    <div className={align === "split" ? "grid gap-8 md:grid-cols-12 md:items-end" : "max-w-3xl"}>
      <div className={align === "split" ? "md:col-span-7" : ""}>
        <RevealLines
          className={`text-[clamp(2.4rem,5.6vw,4.6rem)] font-light leading-[1] ${light ? "text-white" : "text-ink"}`}
          lines={lines}
        />
      </div>
      {intro ? (
        <Reveal delay={0.15} className={align === "split" ? "md:col-span-4 md:col-start-9" : "mt-6"}>
          <p className={`max-w-[52ch] text-base leading-relaxed ${light ? "text-white/70" : "text-stone"}`}>{intro}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
