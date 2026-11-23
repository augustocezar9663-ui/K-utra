"use server";

import { z } from "zod";
import { type ActionState, dbError, done, fail, zodFieldErrors } from "@/lib/action-result";
import { assertAdmin } from "@/lib/auth";
import { bool, optStr, refreshPublic, str } from "./helpers";

/* ------------------------------ Avaliações ------------------------------ */
const reviewSchema = z.object({
  author_name: z.string().min(2, "Informe o nome.").max(80),
  photo_url: z.url().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5, "Comentário muito curto.").max(1200),
  review_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  source: z.string().max(40).nullable(),
  is_published: z.boolean(),
});

export async function saveReview(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const id = optStr(fd, "id");
    const parsed = reviewSchema.safeParse({
      author_name: str(fd, "author_name"),
      photo_url: optStr(fd, "photo_url"),
      rating: Number(str(fd, "rating")),
      comment: str(fd, "comment"),
      review_date: str(fd, "review_date"),
      source: optStr(fd, "source"),
      is_published: bool(fd, "is_published"),
    });
    if (!parsed.success) return fail("Revise os campos destacados.", zodFieldErrors(parsed.error.issues));
    const { error } = id
      ? await supabase.from("reviews").update(parsed.data).eq("id", id)
      : await supabase.from("reviews").insert(parsed.data);
    if (error) return fail(dbError(error));
    refreshPublic("reviews");
    return done("Avaliação salva.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteReview(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("reviews").delete().eq("id", str(fd, "id"));
    if (error) return fail(dbError(error));
    refreshPublic("reviews");
    return done("Avaliação removida.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

/* -------------------------------- Galeria ------------------------------- */
const gallerySchema = z.object({
  image_url: z.url("Envie uma imagem."),
  alt: z.string().max(160),
  category: z.string().max(40).nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(999),
});

export async function saveGalleryImage(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const id = optStr(fd, "id");
    const parsed = gallerySchema.safeParse({
      image_url: str(fd, "image_url"),
      alt: str(fd, "alt"),
      category: optStr(fd, "category"),
      is_active: bool(fd, "is_active"),
      sort_order: Number(str(fd, "sort_order") || 0),
    });
    if (!parsed.success) return fail("Revise os campos destacados.", zodFieldErrors(parsed.error.issues));
    const { error } = id
      ? await supabase.from("gallery_images").update(parsed.data).eq("id", id)
      : await supabase.from("gallery_images").insert(parsed.data);
    if (error) return fail(dbError(error));
    refreshPublic("gallery");
    return done("Imagem salva.");
  } catch (e) {
    return fail((e as Error).message);
  }
}

export async function deleteGalleryImage(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("gallery_images").delete().eq("id", str(fd, "id"));
    if (error) return fail(dbError(error));
    refreshPublic("gallery");
    return done("Imagem removida.");
  } catch (e) {
    return fail((e as Error).message);
  }
}
