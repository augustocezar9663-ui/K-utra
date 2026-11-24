/**
 * Composição gráfica editorial usada enquanto o salão não envia suas
 * próprias fotografias. É determinística (mesma `seed` => mesmo desenho)
 * e leve (SVG inline, sem requisições).
 * Motivo: fios de cabelo em movimento, em traço fino.
 */

type Tone = "ink" | "cream" | "sand" | "accent";

const PALETTES: Record<Tone, { bg: string; glow: string; line: string; lineOpacity: number }> = {
  ink: { bg: "#070a12", glow: "#1a2a55", line: "#5B8CFF", lineOpacity: 0.55 },
  cream: { bg: "#EEF2F9", glow: "#DCE6FB", line: "#07090f", lineOpacity: 0.3 },
  sand: { bg: "#DDE5F3", glow: "#F4F7FD", line: "#1F3A78", lineOpacity: 0.38 },
  accent: { bg: "#1F4FD6", glow: "#5B8CFF", line: "#EAF0FF", lineOpacity: 0.42 },
};

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

export function Artwork({
  seed,
  tone = "ink",
  label,
  className = "",
}: {
  seed: string;
  tone?: Tone;
  label?: string;
  className?: string;
}) {
  const rnd = hash(seed);
  const p = PALETTES[tone];
  const strands = 22;
  const baseY = 180 + rnd() * 260;
  const amp = 140 + rnd() * 160;
  const tilt = -120 + rnd() * 240;
  const glowX = 20 + rnd() * 60;
  const glowY = 15 + rnd() * 50;
  const id = `a${Math.floor(rnd() * 1e9)}`;

  const paths = Array.from({ length: strands }, (_, i) => {
    const o = (i - strands / 2) * (9 + rnd() * 3);
    const y0 = baseY + o;
    const c1 = y0 - amp + rnd() * 40;
    const c2 = y0 + amp * 0.8 + tilt + rnd() * 40;
    const y3 = y0 + tilt * 0.6 + o * 0.4;
    return `M -40 ${y0.toFixed(1)} C 260 ${c1.toFixed(1)}, 540 ${c2.toFixed(1)}, 840 ${y3.toFixed(1)}`;
  });

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`} style={{ background: p.bg }}>
      <svg
        viewBox="0 0 800 1000"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${id}g`} cx={`${glowX}%`} cy={`${glowY}%`} r="75%">
            <stop offset="0%" stopColor={p.glow} stopOpacity="0.95" />
            <stop offset="100%" stopColor={p.bg} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}l`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={p.line} stopOpacity="0" />
            <stop offset="35%" stopColor={p.line} stopOpacity={p.lineOpacity} />
            <stop offset="75%" stopColor={p.line} stopOpacity={p.lineOpacity * 0.8} />
            <stop offset="100%" stopColor={p.line} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="800" height="1000" fill={`url(#${id}g)`} />
        <g fill="none" stroke={`url(#${id}l)`} strokeLinecap="round">
          {paths.map((d, i) => (
            <path key={i} d={d} strokeWidth={i % 5 === 0 ? 1.3 : 0.7} />
          ))}
        </g>
      </svg>
      <div className="grain absolute inset-0" />
      {label ? (
        <span
          className="eyebrow absolute bottom-5 left-5 opacity-70"
          style={{ color: tone === "ink" ? "#5B8CFF" : tone === "accent" ? "#EAF0FF" : "#07090f" }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
