"use server";

import { z } from "zod";
import { type ActionState, dbError, done, fail, zodFieldErrors } from "@/lib/action-result";
import { assertAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { bool, optStr, parseHours, refreshPublic, str } from "./helpers";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(80),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug inválido."),
  specialty: z.string().max(60).nullable(),
  bio: z.string().max(800).nullable(),
  photo_url: z.url("URL inválida.").nullable(),
  instagram: z.string().max(60).nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(999),
});

export async function saveProfessional(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    let id = optStr(fd, "id");
    const name = str(fd, "name");
    const parsed = schema.safeParse({
      name,
      slug: str(fd, "slug") || slugify(name),
      specialty: optStr(fd, "specialty"),
      bio: optStr(fd, "bio"),
      photo_url: optStr(fd, "photo_url"),
      instagram: optStr(fd, "instagram")?.replace(/^@/, "") ?? null,
      is_active: bool(fd, "is_active"),
      sort_order: Number(str(fd, "sort_order") || 0),
    });
    if (!parsed.success) return fail("Revise os campos destacados.", zodFieldErrors(parsed.error.issues));

    const customHours = bool(fd, "custom_hours");
    const hours = customHours ? parseHours(fd) : { ranges: [] };
    if (hours.error) return fail(hours.error);

    const serviceIds = fd.getAll("service_ids").map(String).filter((v) => z.uuid().safeParse(v).success);

    if (id) {
      const { error } = await supabase.from("professionals").update(parsed.data).eq("id", id);
      if (error) return fail(dbError(error));
    } else {
      const { data, error } = await supabase.from("professionals").insert(parsed.data).select("id").single();
      if (error || !data) return fail(dbError(error!));
      id = data.id as string;
    }

    // Serviços realizados
    const del = await supabase.from("professional_services").delete().eq("professional_id", id);
    if (del.error) return fail(dbError(del.error));
    if (serviceIds.length) {
      const ins = await supabase
        .from("professional_services")
        .insert(serviceIds.map((service_id) => ({ professional_id: id, service_id })));
      if (ins.error) return fail(dbError(ins.error));
    }

    // Jornada individual (vazia = segue o horário do salão)
    const delH = await supabase.from("working_hours").delete().eq("professional_id", id);
    if (delH.error) return fail(dbError(delH.error));
    if (hours.ranges.length) {
      const insH = await supabase
        .from("working_hours")
        .insert(hours.ranges.map((r) => ({ ...r, professional_id: id })));
      if (insH.error) return fail(dbError(insH.error));
    }

    refreshPublic("professionals", "hours");
    return done("Profissional salvo.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteProfessional(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const id = str(fd, "id");
    const { error } = await supabase.from("professionals").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        return fail("Este profissional possui agendamentos no histórico. Desative-o em vez de excluir.");
      }
      return fail(dbError(error));
    }
    refreshPublic("professionals", "hours");
    return done("Profissional removido.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
