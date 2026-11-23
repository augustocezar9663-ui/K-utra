import { BlocksManager } from "@/components/admin/blocks-manager";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import type { BlockedTime } from "@/lib/types";

export const metadata = { title: "Bloqueios e feriados" };

export default async function BlocksPage() {
  const { supabase } = await requireAdmin();
  const [{ data: blocks }, { data: pros }, { data: s }] = await Promise.all([
    supabase.from("blocked_times").select("*").gte("ends_at", new Date().toISOString()).order("starts_at"),
    supabase.from("professionals").select("id, name").order("name"),
    supabase.from("business_settings").select("timezone").eq("id", 1).single(),
  ]);
  return (
    <>
      <PageHeader title="Bloqueios e feriados" description="Feriados e fechamentos do salão, folgas e férias de profissionais. Horários bloqueados não aparecem no agendamento e são recusados pelo servidor." />
      <BlocksManager blocks={(blocks ?? []) as BlockedTime[]} professionals={(pros ?? []) as { id: string; name: string }[]} timezone={(s?.timezone as string) ?? "America/Sao_Paulo"} />
    </>
  );
}
