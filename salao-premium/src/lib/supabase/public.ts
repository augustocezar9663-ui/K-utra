import "server-only";
import { createClient } from "@supabase/supabase-js";
import { noStoreFetch } from "./fetch";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "../env";

/**
 * Cliente anônimo SEM cookies: usado para ler conteúdo público dentro de
 * funções `"use cache"`. Respeita RLS (só enxerga dados ativos/publicados).
 */
export function createPublicClient() {
  if (!isSupabaseConfigured) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  });
}
