import Link from "next/link";
import { BarChart, RankList } from "@/components/admin/bar-chart";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatPrice, formatTime } from "@/lib/format";
import { addDaysToKey, dateKeyOf, zonedToUtc } from "@/lib/time";
import type { Appointment, AppointmentService } from "@/lib/types";

export const metadata = { title: "Dashboard" };

const ACTIVE = new Set(["pending", "confirmed", "completed"]);

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const { data: s } = await supabase.from("business_settings").select("timezone").eq("id", 1).single();
  const tz = (s?.timezone as string) ?? "America/Sao_Paulo";
  const now = new Date();
  const today = dateKeyOf(now, tz);
  const from = zonedToUtc(addDaysToKey(today, -180), 0, tz).toISOString();

  const [{ count: totalCount }, { data: appts }, { data: pros }, { count: pendingCount }] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }).neq("status", "cancelled"),
    supabase
      .from("appointments")
      .select("id, code, customer_name, starts_at, status, total_price_cents, professional_id")
      .gte("starts_at", from)
      .order("starts_at")
      .limit(5000),
    supabase.from("professionals").select("id, name"),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending").gte("starts_at", now.toISOString()),
  ]);
  const list = (appts ?? []) as Pick<Appointment, "id" | "code" | "customer_name" | "starts_at" | "status" | "total_price_cents" | "professional_id">[];
  const proName = (id: string) => pros?.find((p) => p.id === id)?.name ?? "—";

  const todays = list.filter((a) => dateKeyOf(new Date(a.starts_at), tz) === today && ACTIVE.has(a.status));
  const upcoming = list.filter((a) => new Date(a.starts_at) >= now && (a.status === "pending" || a.status === "confirmed")).slice(0, 8);

  const monthKey = today.slice(0, 7);
  const completed = list.filter((a) => a.status === "completed");
  const revenueMonth = completed.filter((a) => dateKeyOf(new Date(a.starts_at), tz).startsWith(monthKey)).reduce((n, a) => n + a.total_price_cents, 0);
  const revenue180 = completed.reduce((n, a) => n + a.total_price_cents, 0);

  // Agendamentos por dia: últimos 14 dias + próximos 7
  const dayKeys = Array.from({ length: 21 }, (_, i) => addDaysToKey(today, i - 13));
  const perDay = dayKeys.map((k) => ({
    label: `${k.slice(8)}/${k.slice(5, 7)}`,
    full: k.split("-").reverse().join("/") + (k === today ? " (hoje)" : ""),
    value: list.filter((a) => ACTIVE.has(a.status) && dateKeyOf(new Date(a.starts_at), tz) === k).length,
  }));

  // Faturamento registrado (concluídos) por mês: últimos 6 meses
  const months = Array.from({ length: 6 }, (_, i) => {
    const [y, m] = monthKey.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 - (5 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const perMonth = months.map((mk) => ({
    label: `${MONTHS[Number(mk.slice(5)) - 1]}/${mk.slice(2, 4)}`,
    value: completed.filter((a) => dateKeyOf(new Date(a.starts_at), tz).startsWith(mk)).reduce((n, a) => n + a.total_price_cents, 0),
  }));

  // Serviços mais procurados (últimos 180 dias)
  const activeIds = list.filter((a) => ACTIVE.has(a.status)).map((a) => a.id);
  let top: { label: string; value: number }[] = [];
  if (activeIds.length) {
    const { data: svc } = await supabase.from("appointment_services").select("service_name, appointment_id").in("appointment_id", activeIds.slice(-1000));
    const counts = new Map<string, number>();
    for (const r of (svc ?? []) as Pick<AppointmentService, "service_name">[]) counts.set(r.service_name, (counts.get(r.service_name) ?? 0) + 1);
    top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));
  }

  const kpis = [
    { label: "Total de agendamentos", value: String(totalCount ?? 0), hint: "todos, exceto cancelados" },
    { label: "Agendamentos hoje", value: String(todays.length), hint: `${todays.filter((a) => a.status === "pending").length} pendente(s)` },
    { label: "Aguardando confirmação", value: String(pendingCount ?? 0), hint: "futuros pendentes" },
    { label: "Faturamento no mês", value: formatPrice(revenueMonth), hint: `${formatPrice(revenue180)} em 180 dias` },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Faturamento registrado considera apenas atendimentos marcados como concluídos."
        actions={<Link href="/admin/agendamentos?ver=hoje" className="btn btn-primary">Agenda de hoje</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="border border-line bg-white p-5">
            <p className="eyebrow text-[0.6rem] text-stone">{k.label}</p>
            <p className="mt-3 font-serif text-4xl tabular-nums">{k.value}</p>
            <p className="mt-1 text-xs text-stone">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <BarChart title="Agendamentos por dia" data={perDay} />
        </Panel>
        <Panel>
          <RankList title="Serviços mais procurados" data={top} kind="times" />
        </Panel>
        <Panel className="lg:col-span-2">
          <BarChart title="Faturamento registrado por mês" data={perMonth} kind="currency" />
        </Panel>
        <Panel title="Próximos atendimentos">
          {upcoming.length === 0 ? <p className="text-sm text-stone">Nenhum atendimento futuro.</p> : null}
          <ul className="divide-y divide-line">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.customer_name}</p>
                  <p className="text-xs text-stone">
                    {new Intl.DateTimeFormat("pt-BR", { timeZone: tz, day: "2-digit", month: "2-digit" }).format(new Date(a.starts_at))} ·{" "}
                    {formatTime(a.starts_at, tz)} · {proName(a.professional_id)}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
          <Link href="/admin/agendamentos" className="mt-4 inline-block text-xs underline-offset-4 hover:underline">Ver todos →</Link>
        </Panel>
      </div>
    </>
  );
}
