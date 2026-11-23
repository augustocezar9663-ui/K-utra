"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, fail } from "@/lib/action-result";
import { isSupabaseConfigured } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createSessionClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const schema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(6, "Informe sua senha."),
});

export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured) return fail("Supabase não configurado. Veja docs/SUPABASE.md.");
  const limit = rateLimit(`login:${clientIp(await headers())}`, 10, 15 * 60_000);
  if (!limit.ok) return fail("Muitas tentativas. Aguarde alguns minutos.");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Verifique os campos.", { [String(parsed.error.issues[0].path[0])]: parsed.error.issues[0].message });

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return fail("E-mail ou senha incorretos.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return fail("Esta conta não tem acesso ao painel administrativo.");
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
