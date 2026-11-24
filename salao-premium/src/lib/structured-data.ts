import { formatAddress, instagramLink } from "./address";
import { SITE_URL } from "./env";
import type { BusinessSettings, Service, WorkingHour } from "./types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** JSON-LD schema.org/HairSalon montado apenas com dados cadastrados. */
export function hairSalonJsonLd(s: BusinessSettings, hours: WorkingHour[], services: Service[]) {
  const addr = formatAddress(s);
  const sameAs = [instagramLink(s.instagram), s.facebook, s.tiktok].filter(Boolean);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${SITE_URL}/#salon`,
    name: s.name,
    url: SITE_URL,
    description:
      s.description ??
      "Corte masculino, barba e cuidados capilares com hora marcada.",
    priceRange: "$$$",
  };
  if (s.logo_url) data.logo = s.logo_url;
  if (s.hero_image_url) data.image = s.hero_image_url;
  if (s.phone) data.telephone = `+55${s.phone.replace(/\D/g, "")}`;
  if (s.email) data.email = s.email;
  if (addr.hasAddress) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: [s.address_street, s.address_number, s.address_complement].filter(Boolean).join(", "),
      addressLocality: s.address_city ?? undefined,
      addressRegion: s.address_state ?? undefined,
      postalCode: s.address_zip ?? undefined,
      addressCountry: "BR",
    };
  }
  if (s.latitude != null && s.longitude != null) {
    data.geo = { "@type": "GeoCoordinates", latitude: s.latitude, longitude: s.longitude };
  }
  const salon = hours.filter((h) => h.professional_id === null);
  if (salon.length) {
    data.openingHoursSpecification = salon.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAYS[h.weekday]}`,
      opens: h.start_time.slice(0, 5),
      closes: h.end_time.slice(0, 5),
    }));
  }
  if (sameAs.length) data.sameAs = sameAs;
  if (services.length) {
    data.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Serviços",
      itemListElement: services.map((sv) => ({
        "@type": "Offer",
        price: (sv.price_cents / 100).toFixed(2),
        priceCurrency: "BRL",
        itemOffered: { "@type": "Service", name: sv.name, description: sv.description ?? undefined },
      })),
    };
  }
  data.potentialAction = {
    "@type": "ReserveAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/agendar` },
  };
  return data;
}

/** Serializa JSON-LD de forma segura para <script>. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
