import Image from "next/image";

export function Brand({
  name,
  tagline,
  logoUrl,
  light = false,
}: {
  name: string;
  tagline?: string;
  logoUrl?: string | null;
  light?: boolean;
}) {
  if (logoUrl) {
    return (
      <span className="relative block h-10 w-36">
        <Image src={logoUrl} alt={name} fill sizes="144px" className="object-contain object-left" />
      </span>
    );
  }
  return (
    <span className="flex flex-col leading-none">
      <span
        className={`font-serif text-[1.65rem] tracking-[0.02em] transition-colors duration-300 ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {name}
      </span>
      {tagline ? (
        <span
          className={`mt-1 text-[0.56rem] font-semibold uppercase tracking-[0.42em] transition-colors duration-300 ${
            light ? "text-accent" : "text-stone"
          }`}
        >
          {tagline}
        </span>
      ) : null}
    </span>
  );
}
