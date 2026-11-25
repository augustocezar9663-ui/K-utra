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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
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
    <section id="contato" aria-labelledby="contato-titulo" data-tone="#ffffff" className="py-20 md:py-28">
      {/* sem endereço cadastrado não há mapa: título e contatos lado a lado */}
      <div className={map ? "container-luxe" : "container-luxe grid gap-10 lg:grid-cols-12"}>
        <div id="contato-titulo" className={map ? "" : "lg:col-span-5"}>
          <SectionHeading align="stack" lines={["Espero por você,", "com hora marcada."]} />
        </div>

        <div className={map ? "mt-12 grid gap-10 md:mt-16 lg:grid-cols-12" : "lg:col-span-7"}>
          <Reveal className={map ? "lg:col-span-5" : ""}>
            <dl className="divide-y divide-line border-y border-line">
              {address.hasAddress ? (
                <div className="py-6">
                  <dt className="label flex items-center gap-3 text-stone">
                    <MapPin className="h-4 w-4 shrink-0 text-accent-deep" strokeWidth={1.5} aria-hidden="true" />
                    Onde atendo
                  </dt>
                  <dd className="mt-2 pl-7 text-lg leading-snug">
                    {address.line1}
                    <br />
                    <span className="text-stone">{address.line2}</span>
                    {settings.address_zip ? (
                      <span className="block text-sm text-stone">CEP {settings.address_zip}</span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              {settings.phone || wa ? (
                <div className="py-6">
                  <dt className="label flex items-center gap-3 text-stone">
                    <Phone className="h-4 w-4 shrink-0 text-accent-deep" strokeWidth={1.5} aria-hidden="true" />
                    Telefone & WhatsApp
                  </dt>
                  <dd className="mt-2 pl-7 space-y-1 text-lg">
                    {settings.phone ? (
                      <a className="link-underline block w-fit" href={`tel:+55${settings.phone.replace(/\D/g, "")}`}>
                        {formatPhone(settings.phone)}
                      </a>
                    ) : null}
                    {wa ? (
                      <a
                        className="link-underline flex w-fit items-center gap-2"
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <WhatsAppIcon className="h-4 w-4" /> {formatPhone(settings.whatsapp)}
                      </a>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              {ig ? (
                <div className="py-6">
                  <dt className="label flex items-center gap-3 text-stone">
                    <InstagramIcon className="h-4 w-4 shrink-0 text-accent-deep" />
                    Instagram
                  </dt>
                  <dd className="mt-2 pl-7 text-lg">
                    <a className="link-underline" href={ig} target="_blank" rel="noopener noreferrer">
                      @{settings.instagram?.replace(/^@/, "")}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div className="py-6">
                <dt className="label flex items-center gap-3 text-stone">
                  <Clock className="h-4 w-4 shrink-0 text-accent-deep" strokeWidth={1.5} aria-hidden="true" />
                  Horário de atendimento
                </dt>
                <dd className="mt-3 pl-7 space-y-2">
                  {schedule.map((g) => (
                    <p key={g.label} className="flex justify-between gap-6 text-[0.95rem]">
                      <span>{g.label}</span>
                      <span className={g.closed ? "text-stone" : ""}>{g.value}</span>
                    </p>
                  ))}
                </dd>
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

          {map ? (
            <Reveal delay={0.15} className="lg:col-span-7">
              <div className="relative aspect-[4/3] overflow-hidden bg-sand lg:aspect-auto lg:h-full lg:min-h-[480px]">
                <iframe
                  title={`Mapa — ${settings.name}`}
                  src={map}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full grayscale-[85%] contrast-[1.05]"
                />
              </div>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
