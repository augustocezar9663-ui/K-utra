import { PageHeader } from "@/components/admin/page-header";
import { ServicesManager } from "@/components/admin/services-manager";
import { requireAdmin } from "@/lib/auth";
import type { Service } from "@/lib/types";

export const metadata = { title: "Serviços" };

export default async function ServicesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("services").select("*").order("sort_order").order("name");
  return (
    <>
      <PageHeader title="Serviços" description="Nomes, preços, durações, imagens e disponibilidade dos serviços exibidos no site e no agendamento." />
      <ServicesManager services={(data ?? []) as Service[]} />
    </>
  );
}
