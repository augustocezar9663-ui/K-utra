"use server";

import { z } from "zod";
import { type ActionState, dbError, done, fail } from "@/lib/action-result";
import { assertAdmin } from "@/lib/auth";
import { isDateKey, timeToMinutes, zonedToUtc } from "@/lib/time";
import { optStr, str } from "./helpers";

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;

export async function setAppointmentStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const id = z.uuid().parse(str(fd, "id"));
    const status = z.enum(STATUSES).parse(str(fd, "status"));
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return fail(dbError(error));
    return done("Status atualizado.");
  } catch (e) {
    return fail(e instanceof z.ZodError ? "Dados inválidos." : (e as Error).message);
  }
}

export async function rescheduleAppointment(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const id = z.uuid().parse(str(fd, "id"));
    const date = str(fd, "date");
    const time = str(fd, "time");
    const professionalId = optStr(fd, "professional_id");
    if (!isDateKey(date) || !/^\d{2}:\d{2}$/.test(time)) return fail("Informe data e horário.");

    const [{ data: s }, { data: appt }] = await Promise.all([
      supabase.from("business_settings").select("timezone").eq("id", 1).single(),
      supabase.from("appointments").select("total_duration_minutes, status").eq("id", id).single(),
    ]);
    if (!appt) return fail("Agendamento não encontrado.");
    if (appt.status === "cancelled" || appt.status === "no_show") {
      return fail("Reative o agendamento (status pendente/confirmado) antes de reagendar.");
    }
    const startsAt = zonedToUtc(date, timeToMinutes(time), (s?.timezone as string) ?? "America/Sao_Paulo");
    const endsAt = new Date(startsAt.getTime() + (appt.total_duration_minutes as number) * 60_000);

    const patch: Record<string, string> = { starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() };
    if (professionalId) patch.professional_id = z.uuid().parse(professionalId);

    // A constraint de exclusão impede conflito com outro atendimento do profissional
    const { error } = await supabase.from("appointments").update(patch).eq("id", id);
    if (error) return fail(dbError(error));
    return done("Agendamento reagendado.");
  } catch (e) {
    return fail(e instanceof z.ZodError ? "Dados inválidos." : (e as Error).message);
  }
}
