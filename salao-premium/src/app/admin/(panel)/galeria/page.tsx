import { GalleryManager } from "@/components/admin/gallery-manager";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/auth";
import type { GalleryImage } from "@/lib/types";

export const metadata = { title: "Galeria" };

export default async function GalleryPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("gallery_images").select("*").order("sort_order").order("created_at");
  return (
    <>
      <PageHeader title="Galeria" description="Fotografias de trabalhos realizados no salão. Use imagens próprias, em alta resolução (mínimo 1600px no lado maior)." />
      <GalleryManager images={(data ?? []) as GalleryImage[]} />
    </>
  );
}
