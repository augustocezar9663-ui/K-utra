import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "../supabase/public";
import type {
  BusinessSettings,
  GalleryImage,
  ProfessionalWithServices,
  Review,
  Service,
  WorkingHour,
} from "../types";

/**
 * Leituras de conteúdo PÚBLICO, cacheadas e invalidadas por tag quando o
 * administrador salva alterações (ver `src/lib/data/tags.ts`).
 */

export const DEFAULT_SETTINGS: BusinessSettings = {
  id: 1,
  name: "Seu Nome",
  tagline: "Corte masculino",
  logo_url: null,
  hero_image_url: null,
  about_image_url: null,
  description: null,
  address_street: null,
  address_number: null,
  address_complement: null,
  address_neighborhood: null,
  address_city: null,
  address_state: null,
  address_zip: null,
  latitude: null,
  longitude: null,
  phone: "6996081567", // (69) 9608-1567
  whatsapp: "6996081567",
  email: null,
  instagram: null,
  facebook: null,
  tiktok: null,
  timezone: "America/Sao_Paulo",
  slot_interval_minutes: 15,
  min_advance_minutes: 60,
  max_advance_days: 60,
  auto_confirm: false,
  cancellation_policy: null,
  updated_at: new Date(0).toISOString(),
};

/** Painel invalida na hora via tags; mudanças feitas direto no banco aparecem em até 10 min. */
const CONTENT_LIFE = { stale: 300, revalidate: 600, expire: 86_400 };

function onError(scope: string, error: unknown) {
  console.error(`[data:${scope}]`, error);
  // Não mantém um resultado vazio em cache por muito tempo em caso de falha
  cacheLife("seconds");
}

export async function getSettings(): Promise<BusinessSettings> {
  "use cache";
  cacheTag("settings");
  cacheLife(CONTENT_LIFE);
  const sb = createPublicClient();
  if (!sb) return DEFAULT_SETTINGS;
  const { data, error } = await sb.from("business_settings").select("*").eq("id", 1).maybeSingle();
  if (error) onError("settings", error);
  return (data as BusinessSettings | null) ?? DEFAULT_SETTINGS;
}

export async function getServices(): Promise<Service[]> {
  "use cache";
  cacheTag("services");
  cacheLife(CONTENT_LIFE);
  const sb = createPublicClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) onError("services", error);
  return (data as Service[] | null) ?? [];
}

export async function getProfessionals(): Promise<ProfessionalWithServices[]> {
  "use cache";
  cacheTag("professionals");
  cacheLife(CONTENT_LIFE);
  const sb = createPublicClient();
  if (!sb) return [];
  const [pros, links] = await Promise.all([
    sb.from("professionals").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    sb.from("professional_services").select("professional_id, service_id"),
  ]);
  if (pros.error) onError("professionals", pros.error);
  if (links.error) onError("professional_services", links.error);
  const byPro = new Map<string, string[]>();
  for (const l of (links.data ?? []) as { professional_id: string; service_id: string }[]) {
    byPro.set(l.professional_id, [...(byPro.get(l.professional_id) ?? []), l.service_id]);
  }
  return ((pros.data ?? []) as ProfessionalWithServices[]).map((p) => ({
    ...p,
    service_ids: byPro.get(p.id) ?? [],
  }));
}

export async function getWorkingHours(): Promise<WorkingHour[]> {
  "use cache";
  cacheTag("hours");
  cacheLife(CONTENT_LIFE);
  const sb = createPublicClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("working_hours")
    .select("id, professional_id, weekday, start_time, end_time")
    .order("weekday")
    .order("start_time");
  if (error) onError("hours", error);
  return (data as WorkingHour[] | null) ?? [];
}

export async function getReviews(): Promise<Review[]> {
  "use cache";
  cacheTag("reviews");
  cacheLife(CONTENT_LIFE);
  const sb = createPublicClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("reviews")
    .select("*")
    .eq("is_published", true)
    .order("review_date", { ascending: false })
    .limit(12);
  if (error) onError("reviews", error);
  return (data as Review[] | null) ?? [];
}

export async function getGallery(): Promise<GalleryImage[]> {
  "use cache";
  cacheTag("gallery");
  cacheLife(CONTENT_LIFE);
  const sb = createPublicClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("gallery_images")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(40);
  if (error) onError("gallery", error);
  return (data as GalleryImage[] | null) ?? [];
}
