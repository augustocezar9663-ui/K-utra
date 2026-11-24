"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

type ValueKind = "count" | "currency" | "times";
const FORMATTERS: Record<ValueKind, (v: number) => string> = {
  count: (v) => String(v),
  currency: (v) => formatPrice(v),
  times: (v) => `${v}×`,
};

/** Série única (sem legenda; o título nomeia a série). Cor validada: #2F5BD8 sobre branco. */
const BAR = "#2F5BD8";

export interface BarDatum {
  label: string;
  value: number;
  /** texto completo da categoria no tooltip */
  full?: string;
}

export function BarChart({
  title,
  data,
  kind = "count",
  height = 200,
}: {
  title: string;
  data: BarDatum[];
  kind?: ValueKind;
  height?: number;
}) {
  const format = FORMATTERS[kind];
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 640;
  const H = height;
  const padB = 26;
  const padT = 12;
  const plotH = H - padB - padT;
  const step = W / Math.max(1, data.length);
  const barW = Math.max(4, Math.min(34, step - 6));
  const ticks = [0, 0.5, 1].map((t) => t * max);
  const labelEvery = Math.ceil(data.length / 10);

  return (
    <figure>
      <figcaption className="mb-4 flex items-baseline justify-between">
        <span className="text-xl font-serif">{title}</span>
        {hover !== null ? (
          <span className="text-sm">
            <strong className="font-semibold">{format(data[hover].value)}</strong>{" "}
            <span className="text-stone">· {data[hover].full ?? data[hover].label}</span>
          </span>
        ) : null}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
        {ticks.map((t) => {
          const y = padT + plotH - (t / max) * plotH;
          return (
            <g key={t}>
              <line x1={0} x2={W} y1={y} y2={y} stroke="#E4E9F2" strokeWidth={1} />
              <text x={0} y={y - 4} fontSize={10} fill="#777">
                {format(Math.round(t))}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * plotH;
          const x = i * step + (step - barW) / 2;
          const y = padT + plotH - h;
          const r = Math.min(4, barW / 2, h);
          return (
            <g
              key={i}
              tabIndex={0}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="outline-none"
            >
              <rect x={i * step} y={padT} width={step} height={plotH} fill="transparent" />
              {h > 0 ? (
                <path
                  d={`M${x},${padT + plotH} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${padT + plotH} Z`}
                  fill={BAR}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                  style={{ transition: "opacity .2s" }}
                />
              ) : null}
              {i % labelEvery === 0 ? (
                <text x={i * step + step / 2} y={H - 8} fontSize={10} fill="#777" textAnchor="middle">
                  {d.label}
                </text>
              ) : null}
            </g>
          );
        })}
        <line x1={0} x2={W} y1={padT + plotH} y2={padT + plotH} stroke="#CBD3E1" strokeWidth={1} />
      </svg>
      <details className="mt-3 text-xs text-stone">
        <summary className="cursor-pointer">Ver dados em tabela</summary>
        <table className="mt-2 w-full">
          <tbody>
            {data.map((d, i) => (
              <tr key={i} className="border-b border-line">
                <td className="py-1">{d.full ?? d.label}</td>
                <td className="py-1 text-right tabular-nums text-ink">{format(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Ranking horizontal (serviços mais procurados): rótulo + valor sempre visíveis. */
export function RankList({ title, data, kind = "count" }: { title: string; data: BarDatum[]; kind?: ValueKind }) {
  const format = FORMATTERS[kind];
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <figcaption className="mb-4 font-serif text-xl">{title}</figcaption>
      {data.length === 0 ? <p className="text-sm text-stone">Sem dados no período.</p> : null}
      <ul className="space-y-3">
        {data.map((d) => (
          <li key={d.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{d.label}</span>
              <span className="tabular-nums">{format(d.value)}</span>
            </div>
            <div className="h-2 bg-cream">
              <div className="h-2 rounded-r-[4px]" style={{ width: `${(d.value / max) * 100}%`, background: BAR }} />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
