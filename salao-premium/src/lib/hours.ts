import { WEEKDAY_LABELS } from "./format";
import type { WorkingHour } from "./types";

const hhmm = (t: string) => t.slice(0, 5);

/** Agrupa dias consecutivos com o mesmo horário: "Terça a Sábado — 09:00–19:00". */
export function summarizeHours(hours: WorkingHour[]) {
  const salon = hours.filter((h) => h.professional_id === null);
  const order = [1, 2, 3, 4, 5, 6, 0]; // semana começando na segunda
  const byDay = order.map((d) => {
    const ranges = salon
      .filter((h) => h.weekday === d)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((h) => `${hhmm(h.start_time)}–${hhmm(h.end_time)}`);
    return { day: d, value: ranges.length ? ranges.join(" · ") : "Fechado" };
  });

  const groups: { days: number[]; value: string }[] = [];
  for (const item of byDay) {
    const last = groups[groups.length - 1];
    if (last && last.value === item.value) last.days.push(item.day);
    else groups.push({ days: [item.day], value: item.value });
  }

  return groups.map((g) => {
    const first = WEEKDAY_LABELS[g.days[0]];
    const lastDay = WEEKDAY_LABELS[g.days[g.days.length - 1]];
    const label =
      g.days.length === 1 ? first : g.days.length === 2 ? `${first} e ${lastDay}` : `${first} a ${lastDay}`;
    return { label, value: g.value, closed: g.value === "Fechado" };
  });
}

export function hasConfiguredHours(hours: WorkingHour[]) {
  return hours.some((h) => h.professional_id === null);
}
