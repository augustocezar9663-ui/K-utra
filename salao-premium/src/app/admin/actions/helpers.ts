import "server-only";
import { updateTag } from "next/cache";

export type PublicTag = "settings" | "services" | "professionals" | "hours" | "reviews" | "gallery";

/** Expira imediatamente o cache público após uma alteração do admin. */
export function refreshPublic(...tags: PublicTag[]) {
  for (const t of tags) updateTag(t);
}

export const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};
export const optStr = (fd: FormData, key: string) => str(fd, key) || null;
export const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";

/** Converte "180,00" ou "180.00" em centavos */
export function toCents(value: string): number | null {
  const clean = value.replace(/[^\d,.-]/g, "");
  if (!clean) return null;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export interface HourRange {
  weekday: number;
  start_time: string;
  end_time: string;
}

/** Lê o editor de horários: campos `h-<dia>-<i>-start|end` e `h-<dia>-open`. */
export function parseHours(fd: FormData): { ranges: HourRange[]; error?: string } {
  const ranges: HourRange[] = [];
  for (let d = 0; d < 7; d++) {
    if (!bool(fd, `h-${d}-open`)) continue;
    const dayRanges: HourRange[] = [];
    for (let i = 0; i < 3; i++) {
      const s = str(fd, `h-${d}-${i}-start`);
      const e = str(fd, `h-${d}-${i}-end`);
      if (!s && !e) continue;
      if (!/^\d{2}:\d{2}$/.test(s) || !/^\d{2}:\d{2}$/.test(e) || e <= s) {
        return { ranges: [], error: "Verifique os horários: o fim deve ser depois do início." };
      }
      dayRanges.push({ weekday: d, start_time: s, end_time: e });
    }
    dayRanges.sort((a, b) => a.start_time.localeCompare(b.start_time));
    for (let i = 1; i < dayRanges.length; i++) {
      if (dayRanges[i].start_time < dayRanges[i - 1].end_time) {
        return { ranges: [], error: "Há intervalos sobrepostos no mesmo dia." };
      }
    }
    if (!dayRanges.length) return { ranges: [], error: "Informe ao menos um intervalo para os dias abertos." };
    ranges.push(...dayRanges);
  }
  return { ranges };
}
