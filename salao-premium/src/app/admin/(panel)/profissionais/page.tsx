import { PageHeader } from "@/components/admin/page-header";
import { ProfessionalsManager } from "@/components/admin/professionals-manager";
import { requireAdmin } from "@/lib/auth";
import type { Professional, Service, WorkingHour } from "@/lib/types";

export const metadata = { title: "Profissionais" };

export default async function ProfessionalsPage() {
  const { supabase } = await requireAdmin();
  const [pros, links, services, hours] = await Promise.all([
    supabase.from("professionals").select("*").order("sort_order").order("name"),
    supabase.from("professional_services").select("professional_id, service_id"),
    supabase.from("services").select("*").order("sort_order"),
    supabase.from("working_hours").select("*"),
  ]);
  const list = ((pros.data ?? []) as Professional[]).map((p) => ({
    ...p,
    service_ids: (links.data ?? []).filter((l) => l.professional_id === p.id).map((l) => l.service_id as string),
  }));
  return (
    <>
      <PageHeader
        title="Profissionais"
        description="Equipe exibida no site, serviços que cada pessoa realiza e jornada de trabalho individual."
      />
      <ProfessionalsManager professionals={list} services={(services.data ?? []) as Service[]} hours={(hours.data ?? []) as WorkingHour[]} />
    </>
  );
}
