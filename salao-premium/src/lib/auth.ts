import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "./env";
import { createSessionClient } from "./supabase/server";

/**
 * Data Access Layer do painel: TODA página e Server Action administrativa
 * chama esta função. O proxy faz apenas um redirecionamento otimista; a
 * autorização real acontece aqui e, no banco, pelas políticas RLS.
 */
export async function requireAdmin() {
  // Sempre por requisição: nunca pré-renderizar páginas administrativas
  await connection();
  if (!isSupabaseConfigured) redirect("/admin/login?erro=config");
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/admin/login?erro=permissao");
  return { supabase, user, profile: profile as { id: string; full_name: string | null; role: string } };
}

/** Versão para Server Actions: lança erro em vez de redirecionar. */
export async function assertAdmin() {
  if (!isSupabaseConfigured) throw new Error("Supabase não configurado.");
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Sem permissão.");
  return { supabase, user };
}
