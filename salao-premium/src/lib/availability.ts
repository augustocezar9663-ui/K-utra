import type { BusyInterval, ProfessionalWithServices, WorkingHour } from "./types";
import { minutesToTime, timeToMinutes, weekdayOfKey, zonedToUtc } from "./time";

/**
 * Motor de disponibilidade (puro, sem I/O). As MESMAS regras são aplicadas
 * novamente pelo banco em `book_appointment` no momento da confirmação.
 */

export interface AvailabilityConfig {
  timezone: string;
  slotIntervalMinutes: number;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
}

export interface AvailabilityInput {
  config: AvailabilityConfig;
  /** Horários do salão (professional_id null) + individuais */
  workingHours: WorkingHour[];
  /** Profissionais já filtrados: ativos e que realizam todos os serviços */
  professionals: ProfessionalWithServices[];
  durationMinutes: number;
  busy: BusyInterval[];
  now: Date;
}

export interface Slot {
  time: string; // "HH:MM" no fuso do salão
  startsAt: string; // ISO UTC
  professionalIds: string[];
}

type Range = [number, number]; // minutos do dia

function rangesFor(hours: WorkingHour[], weekday: number): Range[] {
  return hours
    .filter((h) => h.weekday === weekday)
    .map((h) => [timeToMinutes(h.start_time), timeToMinutes(h.end_time)] as Range)
    .sort((a, b) => a[0] - b[0]);
}

function intersect(a: Range[], b: Range[]): Range[] {
  const out: Range[] = [];
  for (const [as, ae] of a) {
    for (const [bs, be] of b) {
      const s = Math.max(as, bs);
      const e = Math.min(ae, be);
      if (e > s) out.push([s, e]);
    }
  }
  return out;
}

/** Profissionais que realizam todos os serviços escolhidos. */
export function eligibleProfessionals(
  professionals: ProfessionalWithServices[],
  serviceIds: string[],
): ProfessionalWithServices[] {
  return professionals.filter(
    (p) => p.is_active && serviceIds.every((id) => p.service_ids.includes(id)),
  );
}

export function computeDaySlots(input: AvailabilityInput, dateKey: string): Slot[] {
  const { config, workingHours, professionals, durationMinutes, busy, now } = input;
  if (durationMinutes <= 0 || professionals.length === 0) return [];

  const weekday = weekdayOfKey(dateKey);
  const salonHours = workingHours.filter((h) => h.professional_id === null);
  const salonRanges = rangesFor(salonHours, weekday);
  if (salonRanges.length === 0) return [];

  const earliest = now.getTime() + config.minAdvanceMinutes * 60_000;
  const latest = now.getTime() + config.maxAdvanceDays * 86_400_000;
  const step = config.slotIntervalMinutes;
  const durMs = durationMinutes * 60_000;

  const busyMs = busy.map((b) => ({
    professional_id: b.professional_id,
    s: new Date(b.starts_at).getTime(),
    e: new Date(b.ends_at).getTime(),
  }));

  const slotMap = new Map<number, Slot>();

  for (const pro of professionals) {
    const ownHours = workingHours.filter((h) => h.professional_id === pro.id);
    const windows = ownHours.length ? intersect(salonRanges, rangesFor(ownHours, weekday)) : salonRanges;
    const proBusy = busyMs.filter((b) => b.professional_id === null || b.professional_id === pro.id);

    for (const [ws, we] of windows) {
      const first = Math.ceil(ws / step) * step;
      for (let m = first; m + durationMinutes <= we; m += step) {
        const start = zonedToUtc(dateKey, m, config.timezone).getTime();
        if (start < earliest || start > latest) continue;
        const end = start + durMs;
        if (proBusy.some((b) => b.s < end && b.e > start)) continue;

        const existing = slotMap.get(m);
        if (existing) existing.professionalIds.push(pro.id);
        else
          slotMap.set(m, {
            time: minutesToTime(m),
            startsAt: new Date(start).toISOString(),
            professionalIds: [pro.id],
          });
      }
    }
  }

  return [...slotMap.entries()].sort((a, b) => a[0] - b[0]).map(([, slot]) => slot);
}
