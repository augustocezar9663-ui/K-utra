import { onlyDigits } from "./format";

/** Normaliza o número para o formato do wa.me (DDI + DDD + número). */
export function normalizeWhatsapp(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = onlyDigits(value);
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if (d.length >= 12 && d.length <= 13) return d;
  return null;
}

/**
 * Link para iniciar conversa. Abrir o link NÃO envia mensagem: o cliente
 * ainda precisa tocar em "enviar" no WhatsApp.
 */
export function whatsappLink(number: string | null | undefined, message?: string): string | null {
  const n = normalizeWhatsapp(number);
  if (!n) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${n}${q}`;
}
