import { NextResponse, type NextRequest } from "next/server";
import { computeDaySlots, eligibleProfessionals } from "@/lib/availability";
import { getProfessionals, getServices, getSettings, getWorkingHours } from "@/lib/data/public";
import { createServiceClient } from "@/lib/supabase/admin";
import { addDaysToKey, dateKeyOf, daysInMonth, zonedToUtc } from "@/lib/time";
import type { BusyInterval } from "@/lib/types";
import { availabilityQuerySchema } from "@/lib/validation";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const parsed = availabilityQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400, headers: noStore });
  }
  const { services: serviceIds, professional, date, month } = parsed.data;

  const db = createServiceClient();
  if (!db) {
    return NextResponse.json(
      { error: "O agendamento online ainda não foi configurado." },
      { status: 503, headers: noStore },
    );
  }

  const [settings, services, professionals, workingHours] = await Promise.all([
    getSettings(),
    getServices(),
    getProfessionals(),
    getWorkingHours(),
  ]);

  const chosen = services.filter((s) => serviceIds.includes(s.id));
  if (chosen.length !== serviceIds.length) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 422, headers: noStore });
  }
  const duration = chosen.reduce((acc, s) => acc + s.duration_minutes, 0);

  let pros = eligibleProfessionals(professionals, serviceIds);
  if (professional !== "any") pros = pros.filter((p) => p.id === professional);

  const tz = settings.timezone;
  const now = new Date();
  const todayKey = dateKeyOf(now, tz);
  const lastKey = addDaysToKey(todayKey, settings.max_advance_days);

  let keys: string[];
  if (date) {
    keys = [date];
  } else {
    const [y, m] = month!.split("-").map(Number);
    keys = Array.from({ length: daysInMonth(y, m) }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
  }
  keys = keys.filter((k) => k >= todayKey && k <= lastKey);

  if (!keys.length || !pros.length) {
    return NextResponse.json(
      { timezone: tz, duration, days: {}, slots: [], professionals: pros.length },
      { headers: noStore },
    );
  }

  const from = zonedToUtc(keys[0], 0, tz).toISOString();
  const to = zonedToUtc(addDaysToKey(keys[keys.length - 1], 1), 0, tz).toISOString();
  const { data: busy, error } = await db.rpc("get_busy_intervals", { p_from: from, p_to: to });
  if (error) {
    console.error("[availability]", error);
    return NextResponse.json({ error: "Não foi possível consultar a agenda." }, { status: 500, headers: noStore });
  }

  const input = {
    config: {
      timezone: tz,
      slotIntervalMinutes: settings.slot_interval_minutes,
      minAdvanceMinutes: settings.min_advance_minutes,
      maxAdvanceDays: settings.max_advance_days,
    },
    workingHours,
    professionals: pros,
    durationMinutes: duration,
    busy: (busy ?? []) as BusyInterval[],
    now,
  };

  if (date) {
    const slots = computeDaySlots(input, date);
    return NextResponse.json({ timezone: tz, duration, slots }, { headers: noStore });
  }

  const days: Record<string, number> = {};
  for (const k of keys) {
    const n = computeDaySlots(input, k).length;
    if (n) days[k] = n;
  }
  return NextResponse.json({ timezone: tz, duration, days, today: todayKey, last: lastKey }, { headers: noStore });
}
