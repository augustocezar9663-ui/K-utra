import { Reveal, RevealLines } from "@/components/ui/reveal";

export function SectionHeading({
  index,
  eyebrow,
  lines,
  intro,
  light = false,
  align = "split",
}: {
  index: string;
  eyebrow: string;
  lines: React.ReactNode[];
  intro?: string;
  light?: boolean;
  align?: "split" | "stack";
}) {
  return (
    <div className={align === "split" ? "grid gap-8 md:grid-cols-12 md:items-end" : "max-w-3xl"}>
      <div className={align === "split" ? "md:col-span-7" : ""}>
        <Reveal>
          <p className={`eyebrow flex items-center gap-4 ${light ? "text-accent" : "text-accent-deep"}`}>
            <span>{index}</span>
            <span className={`h-px w-10 ${light ? "bg-accent/60" : "bg-accent-deep/50"}`} aria-hidden="true" />
            <span className={light ? "text-white/60" : "text-stone"}>{eyebrow}</span>
          </p>
        </Reveal>
        <RevealLines
          className={`mt-6 text-[clamp(2.4rem,5.6vw,4.6rem)] font-light leading-[1] ${light ? "text-white" : "text-ink"}`}
          lines={lines}
        />
      </div>
      {intro ? (
        <Reveal delay={0.2} className={align === "split" ? "md:col-span-4 md:col-start-9" : "mt-6"}>
          <p className={`text-base leading-relaxed ${light ? "text-white/65" : "text-stone"}`}>{intro}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
