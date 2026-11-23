"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAY_SHORT } from "@/lib/format";
import { daysInMonth, weekdayOfKey } from "@/lib/time";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function shiftMonth(monthKey: string, delta: number) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function Calendar({
  month,
  onMonthChange,
  minMonth,
  maxMonth,
  todayKey,
  availableDays,
  loading,
  selected,
  onSelect,
  direction,
}: {
  month: string;
  onMonthChange: (m: string, dir: 1 | -1) => void;
  minMonth: string;
  maxMonth: string;
  todayKey: string;
  availableDays: Record<string, number> | null;
  loading: boolean;
  selected: string | null;
  onSelect: (key: string) => void;
  direction: 1 | -1;
}) {
  const [y, m] = month.split("-").map(Number);
  const total = daysInMonth(y, m);
  const offset = weekdayOfKey(`${month}-01`);
  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];

  return (
    <div className="select-none">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, -1), -1)}
          disabled={month <= minMonth}
          aria-label="Mês anterior"
          className="flex h-11 w-11 items-center justify-center border border-line transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={month}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="font-serif text-2xl"
            aria-live="polite"
          >
            {MONTHS[m - 1]} <span className="text-stone">{y}</span>
          </motion.p>
        </AnimatePresence>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, 1), 1)}
          disabled={month >= maxMonth}
          aria-label="Próximo mês"
          className="flex h-11 w-11 items-center justify-center border border-line transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 text-center" aria-hidden="true">
        {WEEKDAY_SHORT.map((d) => (
          <span key={d} className="eyebrow py-2 text-[0.6rem] text-stone">
            {d}
          </span>
        ))}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={month}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-7 gap-1"
            role="grid"
            aria-label={`Dias de ${MONTHS[m - 1]}`}
          >
            {cells.map((key, i) => {
              if (!key) return <span key={`e${i}`} />;
              const day = Number(key.slice(8));
              const past = key < todayKey;
              const slots = availableDays?.[key] ?? 0;
              const available = !past && slots > 0;
              const isSelected = selected === key;
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  disabled={!available || loading}
                  aria-selected={isSelected}
                  aria-label={`${day} de ${MONTHS[m - 1]}${available ? `, ${slots} horários disponíveis` : ", indisponível"}`}
                  onClick={() => onSelect(key)}
                  className={`relative flex aspect-square items-center justify-center text-[0.95rem] transition-all duration-300 ${
                    isSelected
                      ? "bg-ink text-white"
                      : available
                        ? "bg-cream text-ink hover:bg-champagne"
                        : "text-ink/25"
                  } ${past ? "line-through decoration-ink/20" : ""}`}
                >
                  {loading && !past ? <span className="skeleton absolute inset-1 opacity-60" /> : null}
                  <span className="relative">{day}</span>
                  {available && !isSelected ? (
                    <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-champagne-deep" aria-hidden="true" />
                  ) : null}
                  {isToday && !isSelected ? (
                    <span className="absolute inset-0 border border-champagne-deep/60" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex flex-wrap gap-5 text-xs text-stone">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 bg-cream ring-1 ring-line" /> Disponível
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 bg-ink" /> Selecionado
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 border border-line" /> Indisponível / fechado
        </span>
      </div>
    </div>
  );
}
