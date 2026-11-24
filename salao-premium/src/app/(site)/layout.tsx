import { LuxeCursor } from "@/components/motion/cursor";
import { FooterReveal } from "@/components/motion/footer-reveal";
import { ScrollProgress } from "@/components/motion/scroll-progress";
import { ScrollTone } from "@/components/motion/scroll-tone";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { WhatsAppFloat } from "@/components/site/whatsapp-float";
import { getSettings, getWorkingHours } from "@/lib/data/public";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, hours] = await Promise.all([getSettings(), getWorkingHours()]);
  return (
    <SmoothScroll>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-3 focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <ScrollProgress />
      <ScrollTone />
      <Header name={settings.name} tagline={settings.tagline} logoUrl={settings.logo_url} />
      <main id="conteudo">{children}</main>
      <FooterReveal>
        <Footer settings={settings} hours={hours} />
      </FooterReveal>
      <WhatsAppFloat number={settings.whatsapp} salonName={settings.name} />
      <LuxeCursor />
    </SmoothScroll>
  );
}
