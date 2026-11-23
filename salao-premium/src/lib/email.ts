import "server-only";
import { formatDateLong, formatDuration, formatPrice, formatTime } from "./format";
import type { BusinessSettings } from "./types";

/**
 * Envio de confirmação por e-mail via Resend (opcional).
 * Sem RESEND_API_KEY + EMAIL_FROM nada é enviado e a função retorna false —
 * a interface só informa "e-mail enviado" quando o envio foi aceito.
 */

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

interface ConfirmationEmail {
  to: string | null;
  customerName: string;
  code: string;
  services: string[];
  professionalName: string;
  startsAt: string;
  durationMinutes: number;
  totalPriceCents: number;
  pending: boolean;
  settings: BusinessSettings;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function send(payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export async function sendBookingEmails(e: ConfirmationEmail): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  const tz = e.settings.timezone;
  const when = `${formatDateLong(e.startsAt, tz)} às ${formatTime(e.startsAt, tz)}`;
  const rows: [string, string][] = [
    ["Código", e.code],
    ["Serviços", e.services.join(", ")],
    ["Profissional", e.professionalName],
    ["Data e horário", when],
    ["Duração estimada", formatDuration(e.durationMinutes)],
    ["Valor estimado", formatPrice(e.totalPriceCents)],
  ];
  const html = `<!doctype html><html><body style="margin:0;background:#F7F5F2;font-family:Helvetica,Arial,sans-serif;color:#111">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px"><tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;padding:48px 40px">
    <tr><td style="font-family:Georgia,serif;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#777">${esc(e.settings.name)}</td></tr>
    <tr><td style="padding-top:24px;font-family:Georgia,serif;font-size:30px;line-height:1.2">${e.pending ? "Recebemos seu agendamento" : "Agendamento confirmado"}</td></tr>
    <tr><td style="padding-top:16px;font-size:15px;line-height:1.6;color:#555">Olá, ${esc(e.customerName.split(" ")[0])}. ${
      e.pending
        ? "Sua solicitação foi registrada e será confirmada pela nossa equipe."
        : "Está tudo pronto para receber você."
    }</td></tr>
    <tr><td style="padding-top:32px"><table width="100%" cellpadding="0" cellspacing="0">${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:12px 0;border-bottom:1px solid #eee;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#777">${k}</td><td align="right" style="padding:12px 0;border-bottom:1px solid #eee;font-size:15px">${esc(v)}</td></tr>`,
      )
      .join("")}</table></td></tr>
    ${
      e.settings.cancellation_policy
        ? `<tr><td style="padding-top:28px;font-size:13px;line-height:1.6;color:#777">${esc(e.settings.cancellation_policy)}</td></tr>`
        : ""
    }
  </table></td></tr></table></body></html>`;

  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    await send({
      from: process.env.EMAIL_FROM,
      to: [process.env.ADMIN_NOTIFICATION_EMAIL],
      subject: `Novo agendamento ${e.code} — ${e.customerName}`,
      html,
    }).catch((err) => console.error("[email:admin]", err));
  }
  if (!e.to) return false;
  try {
    await send({
      from: process.env.EMAIL_FROM,
      to: [e.to],
      subject: `${e.pending ? "Agendamento recebido" : "Agendamento confirmado"} · ${e.code}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email]", err);
    return false;
  }
}
