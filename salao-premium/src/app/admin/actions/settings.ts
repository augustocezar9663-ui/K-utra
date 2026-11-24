"use server";

import { z } from "zod";
import { imageUrl } from "@/lib/validation";
import { type ActionState, dbError, done, fail, zodFieldErrors } from "@/lib/action-result";
import { assertAdmin } from "@/lib/auth";
import { onlyDigits } from "@/lib/format";
import { optStr, bool, parseHours, refreshPublic, str } from "./helpers";

const optUrl = imageUrl("URL inválida.").nullable();
const schema = z.object({
  name: z.string().min(2, "Informe o nome do salão.").max(80),
  tagline: z.string().max(40),
  description: z.string().max(600).nullable(),
  logo_url: optUrl,
  hero_image_url: optUrl,
  address_street: z.string().max(120).nullable(),
  address_number: z.string().max(20).nullable(),
  address_complement: z.string().max(60).nullable(),
  address_neighborhood: z.string().max(80).nullable(),
  address_city: z.string().max(80).nullable(),
  address_state: z.string().max(2, "Use a sigla (ex.: SP).").nullable(),
  address_zip: z.string().max(10).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  phone: z.string().regex(/^\d{10,11}$/, "Telefone com DDD (10 ou 11 dígitos).").nullable(),
  whatsapp: z.string().regex(/^\d{10,13}$/, "WhatsApp com DDD (ex.: 11999999999).").nullable(),
  email: z.email("E-mail inválido.").nullable(),
  instagram: z.string().max(60).nullable(),
  facebook: optUrl,
  tiktok: optUrl,
  cancellation_policy: z.string().max(1200).nullable(),
});

const num = (v: string | null) => (v === null || v === "" ? null : Number(v.replace(",", ".")));

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const parsed = schema.safeParse({
      name: str(fd, "name"),
      tagline: str(fd, "tagline"),
      description: optStr(fd, "description"),
      logo_url: optStr(fd, "logo_url"),
      hero_image_url: optStr(fd, "hero_image_url"),
      address_street: optStr(fd, "address_street"),
      address_number: optStr(fd, "address_number"),
      address_complement: optStr(fd, "address_complement"),
      address_neighborhood: optStr(fd, "address_neighborhood"),
      address_city: optStr(fd, "address_city"),
      address_state: optStr(fd, "address_state")?.toUpperCase() ?? null,
      address_zip: optStr(fd, "address_zip"),
      latitude: num(optStr(fd, "latitude")),
      longitude: num(optStr(fd, "longitude")),
      phone: optStr(fd, "phone") ? onlyDigits(str(fd, "phone")) : null,
      whatsapp: optStr(fd, "whatsapp") ? onlyDigits(str(fd, "whatsapp")) : null,
      email: optStr(fd, "email"),
      instagram: optStr(fd, "instagram")?.replace(/^@/, "") ?? null,
      facebook: optStr(fd, "facebook"),
      tiktok: optStr(fd, "tiktok"),
      cancellation_policy: optStr(fd, "cancellation_policy"),
    });
    if (!parsed.success) return fail("Revise os campos destacados.", zodFieldErrors(parsed.error.issues));
    const { error } = await supabase.from("business_settings").upsert({ id: 1, ...parsed.data });
    if (error) return fail(dbError(error));
    refreshPublic("settings");
    return done("Configurações salvas.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

const rules = z.object({
  timezone: z.string().refine((tz) => {
    try {
      new Intl.DateTimeFormat("pt-BR", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Fuso horário inválido."),
  slot_interval_minutes: z.number().int().min(5).max(120),
  min_advance_minutes: z.number().int().min(0).max(10080),
  max_advance_days: z.number().int().min(1).max(365),
  auto_confirm: z.boolean(),
});

export async function saveScheduleRules(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const parsed = rules.safeParse({
      timezone: str(fd, "timezone"),
      slot_interval_minutes: Number(str(fd, "slot_interval_minutes")),
      min_advance_minutes: Number(str(fd, "min_advance_hours")) * 60,
      max_advance_days: Number(str(fd, "max_advance_days")),
      auto_confirm: bool(fd, "auto_confirm"),
    });
    if (!parsed.success) return fail("Revise os campos destacados.", zodFieldErrors(parsed.error.issues));

    const hours = parseHours(fd);
    if (hours.error) return fail(hours.error);

    const { error } = await supabase.from("business_settings").update(parsed.data).eq("id", 1);
    if (error) return fail(dbError(error));

    const del = await supabase.from("working_hours").delete().is("professional_id", null);
    if (del.error) return fail(dbError(del.error));
    if (hours.ranges.length) {
      const ins = await supabase.from("working_hours").insert(hours.ranges.map((r) => ({ ...r, professional_id: null })));
      if (ins.error) return fail(dbError(ins.error));
    }
    refreshPublic("settings", "hours");
    return done("Horários e regras de agendamento salvos.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
