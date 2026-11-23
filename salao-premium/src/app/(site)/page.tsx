import { AboutSection } from "@/components/site/about-section";
import { ContactSection } from "@/components/site/contact-section";
import { CtaBand } from "@/components/site/cta-band";
import { GallerySection } from "@/components/site/gallery-section";
import { Hero } from "@/components/site/hero";
import { ReviewsSection } from "@/components/site/reviews-section";
import { ServicesSection } from "@/components/site/services-section";
import { TeamSection } from "@/components/site/team-section";
import { instagramLink } from "@/lib/address";
import {
  getGallery,
  getProfessionals,
  getReviews,
  getServices,
  getSettings,
  getWorkingHours,
} from "@/lib/data/public";
import { hairSalonJsonLd, jsonLdString } from "@/lib/structured-data";

export default async function HomePage() {
  const [settings, services, professionals, reviews, gallery, hours] = await Promise.all([
    getSettings(),
    getServices(),
    getProfessionals(),
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
      <Hero imageUrl={settings.hero_image_url} name={settings.name} city={settings.address_city} />
      <ServicesSection services={services} />
      <AboutSection imageUrl={settings.about_image_url} name={settings.name} />
      <GallerySection images={gallery} instagramUrl={instagramLink(settings.instagram)} />
      <TeamSection professionals={professionals} />
      <ReviewsSection reviews={reviews} />
      <ContactSection settings={settings} hours={hours} />
      <CtaBand />
    </>
  );
}
