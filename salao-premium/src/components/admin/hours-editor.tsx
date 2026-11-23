"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { WEEKDAY_LABELS } from "@/lib/format";

type Range = { start: string; end: string };
type Day = { open: boolean; ranges: Range[] };

export interface HourRow {
  weekday: number;
  start_time: string;
  end_time: string;
}

/** Editor semanal de horários. Gera campos `h-<dia>-open` e `h-<dia>-<i>-start|end`. */
export function HoursEditor({ initial, disabled = false }: { initial: HourRow[]; disabled?: boolean }) {
  const [days, setDays] = useState<Day[]>(() =>
    Array.from({ length: 7 }, (_, d) => {
      const r = initial
        .filter((h) => h.weekday === d)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
        .map((h) => ({ start: h.start_time.slice(0, 5), end: h.end_time.slice(0, 5) }));
      return { open: r.length > 0, ranges: r.length ? r : [{ start: "09:00", end: "19:00" }] };
    }),
  );
  const order = [1, 2, 3, 4, 5, 6, 0];
  const update = (d: number, fn: (day: Day) => Day) => setDays((cur) => cur.map((x, i) => (i === d ? fn(x) : x)));

  return (
    <div className={`divide-y divide-line border border-line ${disabled ? "pointer-events-none opacity-40" : ""}`}>
      {order.map((d) => {
        const day = days[d];
        return (
          <div key={d} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
            <label className="flex w-40 shrink-0 cursor-pointer items-center gap-3 pt-2.5">
              <input
                type="checkbox"
                name={`h-${d}-open`}
                checked={day.open}
                onChange={(e) => update(d, (x) => ({ ...x, open: e.target.checked }))}
                className="h-4 w-4 accent-ink"
              />
              <span className="text-sm font-medium">{WEEKDAY_LABELS[d]}</span>
            </label>
            {day.open ? (
              <div className="flex flex-1 flex-wrap items-center gap-2">
                {day.ranges.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      name={`h-${d}-${i}-start`}
                      value={r.start}
                      onChange={(e) =>
                        update(d, (x) => ({ ...x, ranges: x.ranges.map((y, k) => (k === i ? { ...y, start: e.target.value } : y)) }))
                      }
                      className="field min-h-11 w-[7.5rem] py-2"
                      aria-label={`${WEEKDAY_LABELS[d]} início ${i + 1}`}
                    />
                    <span className="text-stone">—</span>
                    <input
                      type="time"
                      name={`h-${d}-${i}-end`}
                      value={r.end}
                      onChange={(e) =>
                        update(d, (x) => ({ ...x, ranges: x.ranges.map((y, k) => (k === i ? { ...y, end: e.target.value } : y)) }))
                      }
                      className="field min-h-11 w-[7.5rem] py-2"
                      aria-label={`${WEEKDAY_LABELS[d]} fim ${i + 1}`}
                    />
                    {day.ranges.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => update(d, (x) => ({ ...x, ranges: x.ranges.filter((_, k) => k !== i) }))}
                        className="flex h-11 w-9 items-center justify-center text-stone hover:text-ink"
                        aria-label="Remover intervalo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
                {day.ranges.length < 3 ? (
                  <button
                    type="button"
                    onClick={() => update(d, (x) => ({ ...x, ranges: [...x.ranges, { start: "14:00", end: "18:00" }] }))}
                    className="flex min-h-11 items-center gap-1 px-2 text-xs text-stone hover:text-ink"
                  >
                    <Plus className="h-3.5 w-3.5" /> Intervalo
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="pt-2.5 text-sm text-stone">Fechado</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
