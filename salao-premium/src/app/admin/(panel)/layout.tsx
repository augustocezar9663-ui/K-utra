import { AdminSidebar } from "@/components/admin/sidebar";
import { getSettings } from "@/lib/data/public";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <div className="lg:flex">
      <AdminSidebar salonName={s.name} />
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">{children}</div>
      </div>
    </div>
  );
}
