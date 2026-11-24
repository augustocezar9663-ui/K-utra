import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { directionsLink, formatAddress, instagramLink, mapEmbedUrl } from "@/lib/address";
import { formatPhone } from "@/lib/format";
import { summarizeHours } from "@/lib/hours";
import type { BusinessSettings, WorkingHour } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { SectionHeading } from "./section-heading";
import { WhatsAppIcon } from "./whatsapp-icon";

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function ContactSection({ settings, hours }: { settings: BusinessSettings; hours: WorkingHour[] }) {
  const address = formatAddress(settings);
  const map = mapEmbedUrl(settings);
  const directions = directionsLink(settings);
  const wa = whatsappLink(settings.whatsapp, `Olá, ${settings.name}! Gostaria de mais informações.`);
  const ig = instagramLink(settings.instagram);
  const schedule = summarizeHours(hours);

  return (
    <section id="contato" aria-labelledby="contato-titulo" data-tone="#ffffff" className="py-24 md:py-36">
      <div className="container-luxe">
        <div id="contato-titulo">
          <SectionHeading
            index="06"
            eyebrow="Localização & contato"
            lines={["Esperamos por você.", <em key="e" className="text-champagne-deep">Com hora marcada.</em>]}
          />
        </div>

        <div className="mt-16 grid gap-10 md:mt-20 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <dl className="divide-y divide-line border-y border-line">
              {address.hasAddress ? (
                <div className="grid grid-cols-[2rem_1fr] gap-4 py-6">
                  <MapPin className="mt-1 h-4 w-4 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />
                  <div>
                    <dt className="eyebrow text-stone">Endereço</dt>
                    <dd className="mt-2 text-lg leading-snug">
                      {address.line1}
                      <br />
                      <span className="text-stone">{address.line2}</span>
                      {settings.address_zip ? <span className="block text-sm text-stone">CEP {settings.address_zip}</span> : null}
                    </dd>
                  </div>
                </div>
              ) : null}
              {settings.phone || wa ? (
                <div className="grid grid-cols-[2rem_1fr] gap-4 py-6">
                  <Phone className="mt-1 h-4 w-4 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />
                  <div>
                    <dt className="eyebrow text-stone">Telefone & WhatsApp</dt>
                    <dd className="mt-2 space-y-1 text-lg">
                      {settings.phone ? (
                        <a className="link-underline block w-fit" href={`tel:+55${settings.phone.replace(/\D/g, "")}`}>
                          {formatPhone(settings.phone)}
                        </a>
                      ) : null}
                      {wa ? (
                        <a className="link-underline flex w-fit items-center gap-2" href={wa} target="_blank" rel="noopener noreferrer">
                          <WhatsAppIcon className="h-4 w-4" /> {formatPhone(settings.whatsapp)}
                        </a>
                      ) : null}
                    </dd>
                  </div>
                </div>
              ) : null}
              {ig ? (
                <div className="grid grid-cols-[2rem_1fr] gap-4 py-6">
                  <InstagramIcon className="mt-1 h-4 w-4 text-champagne-deep" />
                  <div>
                    <dt className="eyebrow text-stone">Instagram</dt>
                    <dd className="mt-2 text-lg">
                      <a className="link-underline" href={ig} target="_blank" rel="noopener noreferrer">
                        @{settings.instagram?.replace(/^@/, "")}
                      </a>
                    </dd>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-[2rem_1fr] gap-4 py-6">
                <Clock className="mt-1 h-4 w-4 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <dt className="eyebrow text-stone">Horário de funcionamento</dt>
                  <dd className="mt-3 space-y-2">
                    {schedule.map((g) => (
                      <p key={g.label} className="flex justify-between gap-6 text-[0.95rem]">
                        <span>{g.label}</span>
                        <span className={g.closed ? "text-stone" : ""}>{g.value}</span>
                      </p>
                    ))}
                  </dd>
                </div>
              </div>
            </dl>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {directions ? (
                <a href={directions} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <Navigation className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Como chegar
                </a>
              ) : null}
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  <WhatsAppIcon className="h-4 w-4" /> Conversar
                </a>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-7">
            {map ? (
              <div className="relative aspect-[4/3] overflow-hidden bg-sand lg:aspect-auto lg:h-full lg:min-h-[480px]">
                <iframe
                  title={`Mapa — ${settings.name}`}
                  src={map}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full grayscale-[85%] contrast-[1.05]"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-cream p-10 text-center text-stone lg:h-full">
                O endereço do salão será exibido aqui assim que for cadastrado.
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
