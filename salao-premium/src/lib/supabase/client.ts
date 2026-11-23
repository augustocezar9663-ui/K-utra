"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../env";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Cliente do navegador (somente chave pública). Usado para upload de imagens no painel. */
export function getBrowserClient() {
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
