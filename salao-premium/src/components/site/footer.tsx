import Link from "next/link";
import { formatAddress, instagramLink } from "@/lib/address";
import { formatPhone } from "@/lib/format";
import { summarizeHours } from "@/lib/hours";
import type { BusinessSettings, WorkingHour } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { Brand } from "./brand";
import { NAV_LINKS } from "@/lib/nav";

export function Footer({ settings, hours }: { settings: BusinessSettings; hours: WorkingHour[] }) {
  const address = formatAddress(settings);
  const wa = whatsappLink(settings.whatsapp);
  const ig = instagramLink(settings.instagram);
  const schedule = summarizeHours(hours);
  return (
    <footer className="bg-ink text-white">
      <div className="container-luxe grid gap-14 py-20 md:grid-cols-12 md:py-24">
        <div className="md:col-span-4">
          <Brand name={settings.name} tagline={settings.tagline} light />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/55">
            Técnica, cuidado e sofisticação para valorizar a beleza e a personalidade de cada cliente.
          </p>
          <Link href="/agendar" className="btn btn-champagne mt-8">
            Agendar experiência
          </Link>
        </div>
        <nav aria-label="Rodapé" className="md:col-span-2">
          <p className="eyebrow text-champagne">Navegação</p>
          <ul className="mt-6 space-y-3 text-sm text-white/70">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="link-underline hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-3">
          <p className="eyebrow text-champagne">Contato</p>
          <ul className="mt-6 space-y-3 text-sm text-white/70">
            {address.hasAddress ? <li>{address.line1}<br />{address.line2}</li> : null}
            {settings.phone ? (
              <li>
                <a href={`tel:+55${settings.phone.replace(/\D/g, "")}`} className="link-underline hover:text-white">
                  {formatPhone(settings.phone)}
                </a>
              </li>
            ) : null}
            {wa ? (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-white">
                  WhatsApp
                </a>
              </li>
            ) : null}
            {ig ? (
              <li>
                <a href={ig} target="_blank" rel="noopener noreferrer" className="link-underline hover:text-white">
                  Instagram
                </a>
              </li>
            ) : null}
            {settings.email ? (
              <li>
                <a href={`mailto:${settings.email}`} className="link-underline hover:text-white">
                  {settings.email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="eyebrow text-champagne">Horários</p>
          <ul className="mt-6 space-y-3 text-sm">
            {schedule.map((g) => (
              <li key={g.label} className="flex justify-between gap-4 border-b border-white/10 pb-3">
                <span className="text-white/55">{g.label}</span>
                <span className={g.closed ? "text-white/40" : "text-white/85"}>{g.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-luxe flex flex-col gap-3 py-7 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {settings.name}. Todos os direitos reservados.</p>
          <Link href="/admin" className="link-underline hover:text-white/70">
            Área administrativa
          </Link>
        </div>
      </div>
    </footer>
  );
}
