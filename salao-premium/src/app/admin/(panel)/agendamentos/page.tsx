import Link from "next/link";
import { AppointmentRow } from "@/components/admin/appointment-row";
import { PageHeader } from "@/components/admin/page-header";
import { STATUS_LABEL } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { onlyDigits } from "@/lib/format";
import { addDaysToKey, dateKeyOf, isDateKey, zonedToUtc } from "@/lib/time";
import type { Appointment, AppointmentEvent, AppointmentService, AppointmentStatus } from "@/lib/types";

export const metadata = { title: "Agendamentos" };

const VIEWS = { hoje: "Hoje", proximos: "Próximos", historico: "Histórico", todos: "Todos" } as const;
type View = keyof typeof VIEWS;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const { supabase } = await requireAdmin();
  const { data: settings } = await supabase.from("business_settings").select("timezone, name").eq("id", 1).single();
  const tz = (settings?.timezone as string) ?? "America/Sao_Paulo";
  const today = dateKeyOf(new Date(), tz);

  const date = isDateKey(get("data")) ? get("data") : "";
  const view: View = date ? "todos" : (get("ver") as View) in VIEWS ? (get("ver") as View) : "proximos";
  const status = (Object.keys(STATUS_LABEL) as AppointmentStatus[]).includes(get("status") as AppointmentStatus)
    ? (get("status") as AppointmentStatus)
    : "";
  const q = get("q").replace(/[,()%*\\]/g, " ").trim().slice(0, 60);

  let query = supabase.from("appointments").select("*").limit(300);
  const dayStart = (k: string) => zonedToUtc(k, 0, tz).toISOString();
  if (date) {
    query = query.gte("starts_at", dayStart(date)).lt("starts_at", dayStart(addDaysToKey(date, 1)));
  } else if (view === "hoje") {
    query = query.gte("starts_at", dayStart(today)).lt("starts_at", dayStart(addDaysToKey(today, 1)));
  } else if (view === "proximos") {
    query = query.gte("starts_at", dayStart(today));
  } else if (view === "historico") {
    query = query.lt("starts_at", dayStart(today));
  }
  if (status) query = query.eq("status", status);
  if (q) {
    const digits = onlyDigits(q);
    query = digits.length >= 4
      ? query.or(`customer_phone.ilike.*${digits}*,customer_whatsapp.ilike.*${digits}*,code.ilike.*${q}*`)
      : query.or(`customer_name.ilike.*${q}*,code.ilike.*${q}*`);
  }
  query = query.order("starts_at", { ascending: view !== "historico" });

  const [{ data: appts }, { data: pros }] = await Promise.all([
    query,
    supabase.from("professionals").select("id, name").order("name"),
  ]);
  const list = (appts ?? []) as Appointment[];
  const ids = list.map((a) => a.id);
  const [{ data: svc }, { data: events }] = ids.length
    ? await Promise.all([
        supabase.from("appointment_services").select("*").in("appointment_id", ids).order("position"),
        supabase.from("appointment_events").select("*").in("appointment_id", ids).order("created_at"),
      ])
    : [{ data: [] }, { data: [] }];

  const link = (params: Record<string, string>) => {
    const u = new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}), ...params });
    return `/admin/agendamentos?${u.toString()}`;
  };

  return (
    <>
      <PageHeader title="Agendamentos" description="Confirme, conclua, cancele ou reagende atendimentos. Todas as mudanças ficam registradas no histórico." />

      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link
            key={v}
            href={link({ ver: v })}
            className={`min-h-10 border px-4 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.18em] ${
              view === v && !date ? "border-ink bg-ink text-white" : "border-line bg-white text-stone hover:border-ink"
            }`}
          >
            {VIEWS[v]}
          </Link>
        ))}
      </div>

      <form method="get" className="mb-8 grid gap-3 border border-line bg-white p-4 sm:grid-cols-[1fr_170px_170px_auto] sm:items-end">
        <div>
          <label className="field-label" htmlFor="q">Buscar por nome, telefone ou código</label>
          <input id="q" name="q" defaultValue={q} className="field min-h-11 py-2" placeholder="Maria, 11999..., AU-..." />
        </div>
        <div>
          <label className="field-label" htmlFor="data">Data</label>
          <input id="data" name="data" type="date" defaultValue={date} className="field min-h-11 py-2" />
        </div>
        <div>
          <label className="field-label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status} className="field min-h-11 py-2">
            <option value="">Todos</option>
            {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <input type="hidden" name="ver" value={view} />
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary min-h-11">Filtrar</button>
          <Link href="/admin/agendamentos" className="flex min-h-11 items-center text-xs text-stone hover:text-ink">Limpar</Link>
        </div>
      </form>

      <p className="mb-3 text-sm text-stone">{list.length} agendamento(s){list.length === 300 ? " (exibindo os 300 primeiros)" : ""}</p>
      <ul className="divide-y divide-line border border-line">
        {list.length === 0 ? <li className="bg-white p-8 text-center text-stone">Nenhum agendamento encontrado.</li> : null}
        {list.map((a) => (
          <AppointmentRow
            key={a.id}
            a={a}
            services={((svc ?? []) as AppointmentService[]).filter((s) => s.appointment_id === a.id)}
            events={((events ?? []) as AppointmentEvent[]).filter((e) => e.appointment_id === a.id)}
            professionals={(pros ?? []) as { id: string; name: string }[]}
            timezone={tz}
            salonName={(settings?.name as string) ?? ""}
          />
        ))}
      </ul>
    </>
  );
}
