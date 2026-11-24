"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useActionState, useState } from "react";
import { rescheduleAppointment, setAppointmentStatus } from "@/app/admin/actions/appointments";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";
import { initialState } from "@/lib/action-result";
import { formatDateShort, formatDuration, formatPhone, formatPrice, formatTime } from "@/lib/format";
import { dateKeyOf, minutesOfDayOf, minutesToTime } from "@/lib/time";
import type { Appointment, AppointmentEvent, AppointmentService, AppointmentStatus } from "@/lib/types";
import { whatsappLink } from "@/lib/whatsapp";
import { ActionButton } from "./action-button";
import { ActionForm } from "./action-form";
import { FormMessage, STATUS_LABEL, StatusBadge, SubmitButton } from "./ui";

const fmtStamp = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: tz, dateStyle: "short", timeStyle: "short" }).format(new Date(iso));

export function AppointmentRow({
  a,
  services,
  events,
  professionals,
  timezone,
  salonName,
}: {
  a: Appointment;
  services: AppointmentService[];
  events: AppointmentEvent[];
  professionals: { id: string; name: string }[];
  timezone: string;
  salonName: string;
}) {
  const [panel, setPanel] = useState<"none" | "reschedule" | "history">("none");
  const proName = professionals.find((p) => p.id === a.professional_id)?.name ?? "—";
  const when = `${formatDateShort(a.starts_at, timezone)} às ${formatTime(a.starts_at, timezone)}`;
  const msg = `Olá, ${a.customer_name.split(" ")[0]}! Aqui é do ${salonName}. Seu horário (${services
    .map((s) => s.service_name)
    .join(", ")}) está agendado para ${when} com ${proName}. Código ${a.code}. Podemos confirmar?`;
  const wa = whatsappLink(a.customer_whatsapp, msg);
  const active = a.status === "pending" || a.status === "confirmed";

  const transitions: { to: AppointmentStatus; label: string; confirm?: string }[] = [];
  if (a.status === "pending") transitions.push({ to: "confirmed", label: "Confirmar" });
  if (active) transitions.push({ to: "completed", label: "Concluir" });
  if (active) transitions.push({ to: "no_show", label: "Não compareceu" });
  if (active) transitions.push({ to: "cancelled", label: "Cancelar", confirm: `Cancelar o agendamento ${a.code}? O horário será liberado.` });
  if (a.status === "cancelled" || a.status === "no_show") transitions.push({ to: "pending", label: "Reativar" });

  return (
    <li className="bg-white">
      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[130px_1fr_auto] md:items-center">
        <div>
          <p className="font-serif text-2xl leading-none">{formatTime(a.starts_at, timezone)}</p>
          <p className="mt-1 text-xs text-stone">{formatDateShort(a.starts_at, timezone)}</p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-wider text-stone">{a.code}</p>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{a.customer_name}</p>
            <StatusBadge status={a.status} />
          </div>
          <p className="mt-1 text-sm text-stone">
            {services.map((s) => s.service_name).join(" + ")} · {proName}
            {a.any_professional ? " (primeira disponibilidade)" : ""}
          </p>
          <p className="mt-1 text-sm text-stone">
            {formatDuration(a.total_duration_minutes)} · {formatPrice(a.total_price_cents)} ·{" "}
            <a href={`tel:+55${a.customer_phone}`} className="underline-offset-4 hover:underline">{formatPhone(a.customer_phone)}</a>
            {a.customer_email ? <> · <a href={`mailto:${a.customer_email}`} className="underline-offset-4 hover:underline">{a.customer_email}</a></> : null}
          </p>
          {a.notes ? <p className="mt-2 border-l-2 border-accent pl-3 text-sm italic text-stone">{a.notes}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:max-w-[280px] md:justify-end">
          {transitions.map((t) => (
            <ActionButton
              key={t.to}
              action={setAppointmentStatus}
              fields={{ id: a.id, status: t.to }}
              confirmText={t.confirm}
              className={`min-h-9 text-xs font-semibold uppercase tracking-[0.12em] underline-offset-4 hover:underline ${
                t.to === "cancelled" ? "text-[#a4473b]" : t.to === "confirmed" ? "text-[#2f5a3b]" : ""
              }`}
            >
              {t.label}
            </ActionButton>
          ))}
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-9 items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] underline-offset-4 hover:underline">
              <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
            </a>
          ) : null}
          {active ? (
            <button type="button" onClick={() => setPanel(panel === "reschedule" ? "none" : "reschedule")} className="min-h-9 text-xs font-semibold uppercase tracking-[0.12em] underline-offset-4 hover:underline">
              Reagendar
            </button>
          ) : null}
          <button type="button" onClick={() => setPanel(panel === "history" ? "none" : "history")} className="flex min-h-9 items-center gap-1 text-xs text-stone hover:text-ink" aria-expanded={panel === "history"}>
            Histórico <ChevronDown className={`h-3 w-3 transition-transform ${panel === "history" ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {panel !== "none" ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-line bg-cream/60 p-4 sm:p-5">
              {panel === "reschedule" ? (
                <RescheduleForm a={a} professionals={professionals} timezone={timezone} />
              ) : (
                <ol className="space-y-2 text-sm">
                  {events.length === 0 ? <li className="text-stone">Sem eventos registrados.</li> : null}
                  {events.map((e) => (
                    <li key={e.id} className="flex gap-3">
                      <span className="w-32 shrink-0 text-xs text-stone">{fmtStamp(e.created_at, timezone)}</span>
                      <span>{describeEvent(e, professionals, timezone)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

function describeEvent(e: AppointmentEvent, pros: { id: string; name: string }[], tz: string) {
  if (e.action === "created") return `Agendamento criado${e.actor_id ? " pelo painel" : " pelo site"} (${STATUS_LABEL[e.to_status ?? "pending"]}).`;
  if (e.action === "status_changed") return `Status: ${STATUS_LABEL[e.from_status!]} → ${STATUS_LABEL[e.to_status!]}.`;
  if (e.action === "rescheduled") {
    const d = e.details as Record<string, string>;
    const from = d?.from_starts_at ? fmtStamp(d.from_starts_at, tz) : "?";
    const to = d?.to_starts_at ? fmtStamp(d.to_starts_at, tz) : "?";
    const proChange = d?.from_professional_id !== d?.to_professional_id
      ? ` · ${pros.find((p) => p.id === d.from_professional_id)?.name ?? "?"} → ${pros.find((p) => p.id === d.to_professional_id)?.name ?? "?"}`
      : "";
    return `Reagendado: ${from} → ${to}${proChange}.`;
  }
  if (e.action === "notes_updated") return "Observações atualizadas.";
  return e.action;
}

function RescheduleForm({ a, professionals, timezone }: { a: Appointment; professionals: { id: string; name: string }[]; timezone: string }) {
  const [state, action] = useActionState(rescheduleAppointment, initialState);
  const start = new Date(a.starts_at);
  return (
    <ActionForm action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={a.id} />
      <div>
        <label className="field-label" htmlFor={`rd-${a.id}`}>Data</label>
        <input id={`rd-${a.id}`} type="date" name="date" defaultValue={dateKeyOf(start, timezone)} required className="field min-h-11 py-2" />
      </div>
      <div>
        <label className="field-label" htmlFor={`rt-${a.id}`}>Horário</label>
        <input id={`rt-${a.id}`} type="time" name="time" step={300} defaultValue={minutesToTime(minutesOfDayOf(start, timezone))} required className="field min-h-11 py-2" />
      </div>
      <div>
        <label className="field-label" htmlFor={`rp-${a.id}`}>Profissional</label>
        <select id={`rp-${a.id}`} name="professional_id" defaultValue={a.professional_id} className="field min-h-11 py-2">
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <SubmitButton className="btn btn-primary min-h-11">Salvar novo horário</SubmitButton>
      <div className="basis-full">
        <FormMessage state={state} />
        <p className="mt-1 text-xs text-stone">O sistema impede conflito com outro atendimento do mesmo profissional.</p>
      </div>
    </ActionForm>
  );
}
