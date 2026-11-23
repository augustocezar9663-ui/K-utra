import { z } from "zod";
import { onlyDigits } from "./format";

const phone = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((v) => /^[1-9]{2}9?[0-9]{8}$/.test(v), "Informe um telefone válido com DDD.");

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(120, "Nome muito longo.")
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Informe nome e sobrenome."),
  phone,
  whatsapp: phone,
  email: z
    .union([z.literal(""), z.email("E-mail inválido.").max(160)])
    .optional()
    .transform((v) => (v ? v.toLowerCase() : null)),
  notes: z
    .string()
    .trim()
    .max(1000, "Máximo de 1000 caracteres.")
    .optional()
    .transform((v) => v || null),
});

export const bookingRequestSchema = z.object({
  serviceIds: z.array(z.uuid()).min(1, "Escolha ao menos um serviço.").max(6),
  professionalId: z.uuid().nullable(),
  startsAt: z.iso.datetime({ offset: true }),
  customer: customerSchema,
  /** honeypot anti-spam: deve vir vazio */
  website: z.string().max(0).optional(),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const availabilityQuerySchema = z
  .object({
    services: z
      .string()
      .transform((v) => [...new Set(v.split(",").filter(Boolean))])
      .pipe(z.array(z.uuid()).min(1).max(6)),
    professional: z.union([z.literal("any"), z.uuid()]).default("any"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional(),
  })
  .refine((v) => Boolean(v.date) !== Boolean(v.month), "Informe date OU month.");

export const BOOKING_ERRORS: Record<string, { status: number; message: string }> = {
  SLOT_UNAVAILABLE: {
    status: 409,
    message: "Este horário acabou de ser reservado. Por favor, escolha outro horário disponível.",
  },
  TOO_SOON: { status: 422, message: "Este horário não respeita a antecedência mínima para agendamento." },
  TOO_FAR: { status: 422, message: "Esta data está além do período disponível para agendamento." },
  INVALID_TIME: { status: 422, message: "Horário inválido. Escolha um dos horários exibidos." },
  OUTSIDE_HOURS: { status: 422, message: "O horário escolhido está fora do horário de atendimento." },
  BLOCKED: { status: 409, message: "Esta data não está disponível para atendimentos." },
  INVALID_SERVICES: { status: 422, message: "Um ou mais serviços não estão mais disponíveis." },
  PROFESSIONAL_UNAVAILABLE: { status: 409, message: "O profissional escolhido não está disponível." },
  SETTINGS_MISSING: { status: 503, message: "O agendamento online ainda não foi configurado." },
};
