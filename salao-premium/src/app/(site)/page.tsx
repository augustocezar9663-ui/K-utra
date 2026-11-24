import { AboutSection } from "@/components/site/about-section";
import { ContactSection } from "@/components/site/contact-section";
import { CtaBand } from "@/components/site/cta-band";
import { GallerySection } from "@/components/site/gallery-section";
import { GlassHero } from "@/components/site/glass-hero/glass-hero";
import { VelocityMarquee } from "@/components/motion/velocity-marquee";
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
      <GlassHero imageUrl={settings.hero_image_url} name={settings.name} city={settings.address_city} />
      <ServicesSection services={services} />
      <AboutSection imageUrl={settings.about_image_url} name={settings.name} />
      <section aria-label="Especialidades" data-tone="#ffffff" className="py-10 md:py-16">
        <VelocityMarquee
          items={services.length ? services.map((s) => s.name) : ["Corte masculino", "Barba", "Coloração", "Pigmentação", "Hidratação"]}
          className="font-serif text-[clamp(3.2rem,9vw,8.5rem)] font-light leading-none text-ink"
        />
      </section>
      <GallerySection images={gallery} instagramUrl={instagramLink(settings.instagram)} />
      <TeamSection professionals={professionals} />
      <ReviewsSection reviews={reviews} />
      <ContactSection settings={settings} hours={hours} />
      <CtaBand />
    </>
  );
}
