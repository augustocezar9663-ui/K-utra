import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard, type SalonInfo } from "@/components/booking/booking-wizard";
import { formatAddress } from "@/lib/address";
import { getProfessionals, getServices, getSettings } from "@/lib/data/public";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Agendar horário",
  description:
    "Agende online o seu horário: escolha o serviço, o profissional, a data e o horário disponível em poucos passos.",
  alternates: { canonical: "/agendar" },
};

function WizardSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-12" aria-busy="true" aria-label="Carregando agendamento">
      <div className="space-y-6 lg:col-span-8">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-12 w-1/2" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      </div>
      <div className="skeleton h-80 lg:col-span-4" />
    </div>
  );
}

export default async function BookingPage() {
  const [settings, services, professionals] = await Promise.all([getSettings(), getServices(), getProfessionals()]);

  const salon: SalonInfo = {
    name: settings.name,
    whatsapp: settings.whatsapp,
    timezone: settings.timezone,
    address: formatAddress(settings).full,
    cancellationPolicy: settings.cancellation_policy,
    maxAdvanceDays: settings.max_advance_days,
    configured: isSupabaseConfigured && services.length > 0,
  };

  return (
    <div className="min-h-screen bg-cream pb-24 pt-32 md:pt-40">
      <div className="container-luxe">
        <header className="mb-12 max-w-3xl md:mb-16">
          <p className="eyebrow flex items-center gap-4 text-champagne-deep">
            <span className="h-px w-10 bg-champagne-deep/50" aria-hidden="true" />
            Agendamento online
          </p>
          <h1 className="mt-5 text-[clamp(2.8rem,7vw,5.2rem)] font-light leading-[0.98]">
            Reserve sua <em className="text-champagne-deep">experiência.</em>
          </h1>
        </header>
        <Suspense fallback={<WizardSkeleton />}>
          <BookingWizard services={services} professionals={professionals} salon={salon} />
        </Suspense>
      </div>
    </div>
  );
}
