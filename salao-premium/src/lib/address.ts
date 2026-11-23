import type { BusinessSettings } from "./types";

export function formatAddress(s: BusinessSettings) {
  const line1 = [s.address_street, s.address_number].filter(Boolean).join(", ");
  const line1b = [line1, s.address_complement].filter(Boolean).join(" — ");
  const line2 = [s.address_neighborhood, [s.address_city, s.address_state].filter(Boolean).join(" / ")]
    .filter(Boolean)
    .join(", ");
  const full = [line1b, line2, s.address_zip ? `CEP ${s.address_zip}` : ""].filter(Boolean).join(" · ");
  return { line1: line1b, line2, full, hasAddress: Boolean(line1 || line2) };
}

export function mapsQuery(s: BusinessSettings) {
  if (s.latitude != null && s.longitude != null) return `${s.latitude},${s.longitude}`;
  const { full } = formatAddress(s);
  return full ? `${s.name}, ${full}` : "";
}

export function directionsLink(s: BusinessSettings) {
  const q = mapsQuery(s);
  return q ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}` : null;
}

export function mapEmbedUrl(s: BusinessSettings) {
  const q = mapsQuery(s);
  return q ? `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed` : null;
}

export function instagramLink(handle: string | null) {
  if (!handle) return null;
  const h = handle.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
  return h ? `https://instagram.com/${h}` : null;
}
