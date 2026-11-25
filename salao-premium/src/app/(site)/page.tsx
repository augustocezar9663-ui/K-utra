import { AboutSection } from "@/components/site/about-section";
import { ContactSection } from "@/components/site/contact-section";
import { CtaBand } from "@/components/site/cta-band";
import { GallerySection } from "@/components/site/gallery-section";
import { GlassHero } from "@/components/site/glass-hero/glass-hero";
import { ReviewsSection } from "@/components/site/reviews-section";
import { ServicesSection } from "@/components/site/services-section";
import { instagramLink } from "@/lib/address";
import { getGallery, getReviews, getServices, getSettings, getWorkingHours } from "@/lib/data/public";
import { hairSalonJsonLd, jsonLdString } from "@/lib/structured-data";

export default async function HomePage() {
  const [settings, services, reviews, gallery, hours] = await Promise.all([
    getSettings(),
    getServices(),
    getReviews(),
    getGallery(),
    getWorkingHours(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(hairSalonJsonLd(settings, hours, services)) }}
      />
      <GlassHero
        imageUrl={settings.hero_image_url}
        name={settings.name}
        tagline={settings.tagline}
        city={settings.address_city}
      />
      <ServicesSection services={services} />
      <GallerySection images={gallery} instagramUrl={instagramLink(settings.instagram)} />
      <AboutSection />
      <ReviewsSection reviews={reviews} />
      <ContactSection settings={settings} hours={hours} />
      <CtaBand />
    </>
  );
}
