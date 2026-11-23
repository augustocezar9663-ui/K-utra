import "server-only";
import { createClient } from "@supabase/supabase-js";
import { noStoreFetch } from "./fetch";
import { SUPABASE_URL } from "../env";

/**
 * Cliente com a service_role. Ignora RLS — use SOMENTE no servidor e
 * somente para operações que já foram validadas (agendamento público e
 * cálculo de ocupação). Nunca importe este arquivo em Client Components.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  });
}
