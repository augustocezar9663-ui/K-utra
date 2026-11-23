import { PageHeader } from "@/components/admin/page-header";
import { ScheduleForm, SettingsForm } from "@/components/admin/settings-forms";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/lib/data/public";
import type { BusinessSettings, WorkingHour } from "@/lib/types";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: s }, { data: hours }] = await Promise.all([
    supabase.from("business_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("working_hours").select("*").is("professional_id", null),
  ]);
  const settings = (s as BusinessSettings | null) ?? DEFAULT_SETTINGS;
  return (
    <>
      <PageHeader title="Configurações" description="Dados exibidos no site, horários de funcionamento, dias de atendimento e regras do agendamento online." />
      <div className="space-y-10">
        <ScheduleForm s={settings} hours={(hours ?? []) as WorkingHour[]} />
        <SettingsForm s={settings} />
      </div>
    </>
  );
}
