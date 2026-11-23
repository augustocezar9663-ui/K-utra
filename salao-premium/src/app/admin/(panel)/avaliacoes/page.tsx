import { PageHeader } from "@/components/admin/page-header";
import { ReviewsManager } from "@/components/admin/reviews-manager";
import { requireAdmin } from "@/lib/auth";
import { dateKeyOf } from "@/lib/time";
import type { Review } from "@/lib/types";

export const metadata = { title: "Avaliações" };

export default async function ReviewsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("reviews").select("*").order("review_date", { ascending: false });
  return (
    <>
      <PageHeader title="Avaliações" description="Depoimentos reais de clientes exibidos no site." />
      <ReviewsManager reviews={(data ?? []) as Review[]} today={dateKeyOf(new Date(), "America/Sao_Paulo")} />
    </>
  );
}
