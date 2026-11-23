"use server";

import { z } from "zod";
import { type ActionState, dbError, done, fail } from "@/lib/action-result";
import { assertAdmin } from "@/lib/auth";
import { addDaysToKey, isDateKey, timeToMinutes, zonedToUtc } from "@/lib/time";
import { bool, optStr, str } from "./helpers";

export async function createBlock(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const { data: s } = await supabase.from("business_settings").select("timezone").eq("id", 1).single();
    const tz = (s?.timezone as string) ?? "America/Sao_Paulo";

    const professionalId = optStr(fd, "professional_id");
    if (professionalId && !z.uuid().safeParse(professionalId).success) return fail("Profissional inválido.");
    const start = str(fd, "date_start");
    const end = str(fd, "date_end") || start;
    if (!isDateKey(start) || !isDateKey(end) || end < start) return fail("Verifique as datas.");

    let startsAt: Date;
    let endsAt: Date;
    if (bool(fd, "all_day")) {
      startsAt = zonedToUtc(start, 0, tz);
      endsAt = zonedToUtc(addDaysToKey(end, 1), 0, tz);
    } else {
      const ts = str(fd, "time_start");
      const te = str(fd, "time_end");
      if (!/^\d{2}:\d{2}$/.test(ts) || !/^\d{2}:\d{2}$/.test(te)) return fail("Informe o horário inicial e final.");
      startsAt = zonedToUtc(start, timeToMinutes(ts), tz);
      endsAt = zonedToUtc(end, timeToMinutes(te), tz);
      if (endsAt <= startsAt) return fail("O fim do bloqueio deve ser depois do início.");
    }

    const { error } = await supabase.from("blocked_times").insert({
      professional_id: professionalId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      reason: optStr(fd, "reason")?.slice(0, 120) ?? null,
    });
    if (error) return fail(dbError(error));
    return done("Bloqueio criado. Os horários afetados deixam de aparecer na agenda.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteBlock(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("blocked_times").delete().eq("id", str(fd, "id"));
    if (error) return fail(dbError(error));
    return done("Bloqueio removido.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
