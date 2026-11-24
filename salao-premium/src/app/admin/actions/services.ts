"use server";

import { z } from "zod";
import { type ActionState, dbError, done, fail, zodFieldErrors } from "@/lib/action-result";
import { assertAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { bool, optStr, refreshPublic, str, toCents } from "./helpers";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(80),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens."),
  description: z.string().max(600).nullable(),
  category: z.string().max(40).nullable(),
  duration_minutes: z.number().int().min(5, "Mínimo de 5 minutos.").max(600),
  price_cents: z.number().int().min(0, "Preço inválido."),
  price_from: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(999),
});

export async function saveService(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const id = optStr(fd, "id");
    const name = str(fd, "name");
    const parsed = schema.safeParse({
      name,
      slug: str(fd, "slug") || slugify(name),
      description: optStr(fd, "description"),
      category: optStr(fd, "category"),
      duration_minutes: Number(str(fd, "duration_minutes")),
      price_cents: toCents(str(fd, "price")) ?? -1,
      price_from: bool(fd, "price_from"),
      is_active: bool(fd, "is_active"),
      sort_order: Number(str(fd, "sort_order") || 0),
    });
    if (!parsed.success) return fail("Revise os campos destacados.", zodFieldErrors(parsed.error.issues));

    const { error } = id
      ? await supabase.from("services").update(parsed.data).eq("id", id)
      : await supabase.from("services").insert(parsed.data);
    if (error) return fail(dbError(error));
    refreshPublic("services");
    return done(id ? "Serviço atualizado." : "Serviço criado.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteService(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("services").delete().eq("id", str(fd, "id"));
    if (error) return fail(dbError(error));
    refreshPublic("services", "professionals");
    return done("Serviço removido.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
