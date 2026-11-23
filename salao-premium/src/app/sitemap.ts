import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/data/public";
import { SITE_URL } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getSettings();
  const lastModified = new Date(s.updated_at);
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/agendar`, lastModified, changeFrequency: "weekly", priority: 0.9 },
  ];
}
