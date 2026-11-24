"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CalendarPlus, Download } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";
import { formatDateLong, formatDuration, formatPrice, formatTime } from "@/lib/format";
import { buildIcs, googleCalendarLink, type CalendarEvent } from "@/lib/ics";
import type { BookingResult } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";

export function BookingSuccess({
  result,
  services,
  customerName,
  salon,
  onNew,
}: {
  result: BookingResult;
  services: string[];
  customerName: string;
  salon: { name: string; whatsapp: string | null; timezone: string; address: string; cancellationPolicy: string | null };
  onNew: () => void;
}) {
  const tz = salon.timezone;
  const when = `${formatDateLong(result.startsAt, tz)}, às ${formatTime(result.startsAt, tz)}`;
  const pending = result.status === "pending";

  const event: CalendarEvent = {
    uid: `${result.code}@agendamento`,
    title: `${services.join(" + ")} · ${salon.name}`,
    description: `Código ${result.code}\nProfissional: ${result.professionalName}\nServiços: ${services.join(", ")}`,
    location: salon.address || undefined,
    startsAt: result.startsAt,
    endsAt: result.endsAt,
  };

  const message = [
    `Olá, ${salon.name}! Acabei de fazer um agendamento pelo site.`,
    ``,
    `Código: ${result.code}`,
    `Nome: ${customerName}`,
    `Serviço(s): ${services.join(", ")}`,
    `Profissional: ${result.professionalName}`,
    `Data: ${when}`,
    `Valor estimado: ${formatPrice(result.totalPriceCents)}`,
    ``,
    pending ? `Poderiam confirmar meu horário, por favor?` : `Obrigado(a)!`,
  ].join("\n");
  const wa = whatsappLink(salon.whatsapp, message);

  function downloadIcs() {
    const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agendamento-${result.code}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="mx-auto max-w-2xl text-center" role="status" aria-live="polite">
      <motion.svg
        viewBox="0 0 96 96"
        className="mx-auto h-24 w-24"
        initial="hidden"
        animate="visible"
        aria-hidden="true"
      >
        <motion.circle
          cx="48"
          cy="48"
          r="45"
          fill="none"
          stroke="#1F4FD6"
          strokeWidth="1.2"
          variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.path
          d="M30 49 L43 61 L67 36"
          fill="none"
          stroke="#111"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
          transition={{ duration: 0.6, delay: 0.9, ease: [0.65, 0, 0.35, 1] }}
        />
      </motion.svg>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }}>
        <p className="label mt-8 text-accent-deep">{pending ? "Solicitação registrada" : "Agendamento confirmado"}</p>
        <h2 className="mt-4 text-[clamp(2.4rem,6vw,3.8rem)] font-light leading-[1.02]">
          {pending ? "Seu horário está reservado." : "Tudo pronto para receber você."}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-stone">
          {pending
            ? "O horário já está bloqueado na nossa agenda e aguarda a confirmação da equipe do salão."
            : "Seu horário foi confirmado na nossa agenda."}
          {result.emailSent ? " Enviamos os detalhes para o seu e-mail." : ""}
        </p>

        <div className="mt-10 border border-line bg-white p-6 text-left sm:p-8">
          <div className="flex items-center justify-between border-b border-line pb-5">
            <span className="label text-stone">Código do agendamento</span>
            <span className="font-serif text-2xl tracking-[0.08em]">{result.code}</span>
          </div>
          <dl className="mt-2 divide-y divide-line text-sm">
            {[
              ["Cliente", customerName],
              ["Serviços", services.join(", ")],
              ["Profissional", result.professionalName],
              ["Data e horário", when],
              ["Duração estimada", formatDuration(result.totalDurationMinutes)],
              ["Valor estimado", formatPrice(result.totalPriceCents)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 py-3.5">
                <dt className="text-stone">{k}</dt>
                <dd className="text-right first-letter:uppercase">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary sm:col-span-2">
              <WhatsAppIcon className="h-4 w-4 text-accent" />
              {pending ? "Solicitar confirmação no WhatsApp" : "Falar com o salão no WhatsApp"}
            </a>
          ) : null}
          <button type="button" onClick={downloadIcs} className="btn btn-outline">
            <Download className="h-4 w-4" strokeWidth={1.5} /> Baixar evento (.ics)
          </button>
          <a href={googleCalendarLink(event)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            <CalendarPlus className="h-4 w-4" strokeWidth={1.5} /> Google Agenda
          </a>
        </div>
        {wa ? (
          <p className="mt-4 text-xs text-stone">
            O botão do WhatsApp abre a conversa com a mensagem pronta — ela só é enviada quando você tocar em enviar.
          </p>
        ) : null}

        {salon.cancellationPolicy ? (
          <p className="mx-auto mt-10 max-w-lg border-t border-line pt-6 text-xs leading-relaxed text-stone">
            {salon.cancellationPolicy}
          </p>
        ) : null}

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button type="button" onClick={onNew} className="link-underline pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em]">
            Fazer outro agendamento
          </button>
          <span className="hidden text-line sm:block">|</span>
          <Link href="/" className="link-underline pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em]">
            Voltar ao início
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
