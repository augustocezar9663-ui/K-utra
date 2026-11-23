import { NextResponse, type NextRequest } from "next/server";
import { getProfessionals, getServices, getSettings } from "@/lib/data/public";
import { sendBookingEmails } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/admin";
import type { BookingResult } from "@/lib/types";
import { BOOKING_ERRORS, bookingRequestSchema } from "@/lib/validation";

const noStore = { "Cache-Control": "no-store" };

interface RpcRow {
  appointment_id: string;
  code: string;
  professional_id: string;
  professional_name: string;
  starts_at: string;
  ends_at: string;
  total_duration_minutes: number;
  total_price_cents: number;
  status: BookingResult["status"];
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(`book:${clientIp(request.headers)}`, 8, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente." },
      { status: 429, headers: { ...noStore, "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400, headers: noStore });
  }

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Revise os dados informados.",
        fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])),
      },
      { status: 422, headers: noStore },
    );
  }

  const db = createServiceClient();
  if (!db) {
    return NextResponse.json(
      { error: BOOKING_ERRORS.SETTINGS_MISSING.message },
      { status: 503, headers: noStore },
    );
  }

  const { serviceIds, professionalId, startsAt, customer } = parsed.data;

  // Revalidação completa e gravação atômica no banco (ver 0002_booking.sql)
  const { data, error } = await db
    .rpc("book_appointment", {
      p_service_ids: serviceIds,
      p_professional_id: professionalId,
      p_starts_at: startsAt,
      p_customer_name: customer.name,
      p_customer_phone: customer.phone,
      p_customer_whatsapp: customer.whatsapp,
      p_customer_email: customer.email,
      p_notes: customer.notes,
    })
    .single<RpcRow>();

  if (error || !data) {
    const known = error?.message && BOOKING_ERRORS[error.message.trim()];
    if (known) {
      return NextResponse.json(
        { error: known.message, code: error!.message.trim() },
        { status: known.status, headers: noStore },
      );
    }
    console.error("[booking]", error);
    return NextResponse.json(
      { error: "Não foi possível concluir o agendamento. Tente novamente em instantes." },
      { status: 500, headers: noStore },
    );
  }

  const [settings, services, professionals] = await Promise.all([getSettings(), getServices(), getProfessionals()]);
  const serviceNames = serviceIds.map((id) => services.find((s) => s.id === id)?.name ?? "Serviço");
  const professionalName = professionals.find((p) => p.id === data.professional_id)?.name ?? data.professional_name;

  const emailSent = await sendBookingEmails({
    to: customer.email,
    customerName: customer.name,
    code: data.code,
    services: serviceNames,
    professionalName,
    startsAt: data.starts_at,
    durationMinutes: data.total_duration_minutes,
    totalPriceCents: data.total_price_cents,
    pending: data.status === "pending",
    settings,
  });

  const result: BookingResult = {
    appointmentId: data.appointment_id,
    code: data.code,
    professionalId: data.professional_id,
    professionalName,
    startsAt: new Date(data.starts_at).toISOString(),
    endsAt: new Date(data.ends_at).toISOString(),
    totalDurationMinutes: data.total_duration_minutes,
    totalPriceCents: data.total_price_cents,
    status: data.status,
    emailSent,
  };
  return NextResponse.json(result, { status: 201, headers: noStore });
}
