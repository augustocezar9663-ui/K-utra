"use client";

import { Star } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { deleteReview, saveReview } from "@/app/admin/actions/content";
import { initialState } from "@/lib/action-result";
import type { Review } from "@/lib/types";
import { ActionButton } from "./action-button";
import { ActionForm } from "./action-form";
import { ImageUpload } from "./image-upload";
import { FieldError, FormMessage, SubmitButton } from "./ui";

export function ReviewsManager({ reviews, today }: { reviews: Review[]; today: string }) {
  const [editing, setEditing] = useState<Review | null>(null);
  const [formKey, setFormKey] = useState(0);
  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <ReviewForm key={editing?.id ?? `new-${formKey}`} review={editing} today={today} onDone={() => { setEditing(null); setFormKey((k) => k + 1); }} />
      <ul className="space-y-3 self-start">
        {reviews.length === 0 ? <li className="border border-line bg-white p-6 text-sm text-stone">Nenhuma avaliação cadastrada. A seção de depoimentos fica oculta no site até que exista ao menos uma avaliação publicada.</li> : null}
        {reviews.map((r) => (
          <li key={r.id} className="border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{r.author_name} <span className="text-xs text-stone">· {r.review_date.split("-").reverse().join("/")}{r.source ? ` · ${r.source}` : ""}{!r.is_published ? " · não publicada" : ""}</span></p>
              <span className="flex gap-0.5" aria-label={`Nota ${r.rating}`}>{Array.from({ length: 5 }, (_, k) => <Star key={k} className={`h-3 w-3 ${k < r.rating ? "fill-champagne-deep text-champagne-deep" : "text-line"}`} />)}</span>
            </div>
            <p className="mt-2 text-sm text-stone">“{r.comment}”</p>
            <div className="mt-3 flex gap-4 text-xs">
              <button type="button" onClick={() => setEditing(r)} className="hover:underline">Editar</button>
              <ActionButton action={deleteReview} fields={{ id: r.id }} confirmText="Excluir esta avaliação?" className="text-[#a4473b] hover:underline">Excluir</ActionButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewForm({ review, today, onDone }: { review: Review | null; today: string; onDone: () => void }) {
  const [state, action] = useActionState(saveReview, initialState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  return (
    <ActionForm action={action} className="space-y-4 self-start border border-line bg-white p-5">
      <h2 className="text-2xl">{review ? "Editar avaliação" : "Nova avaliação"}</h2>
      <p className="text-xs text-stone">Cadastre somente avaliações reais, com autorização do cliente.</p>
      {review ? <input type="hidden" name="id" value={review.id} /> : null}
      <div>
        <label className="field-label" htmlFor="r-name">Nome do cliente *</label>
        <input id="r-name" name="author_name" defaultValue={review?.author_name} required className="field" />
        <FieldError state={state} name="author_name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="r-rating">Nota *</label>
          <select id="r-rating" name="rating" defaultValue={review?.rating ?? 5} className="field">
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrela{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="r-date">Data *</label>
          <input id="r-date" name="review_date" type="date" defaultValue={review?.review_date ?? today} required className="field" />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="r-comment">Comentário *</label>
        <textarea id="r-comment" name="comment" rows={4} maxLength={1200} defaultValue={review?.comment} required className="field" />
        <FieldError state={state} name="comment" />
      </div>
      <div>
        <label className="field-label" htmlFor="r-src">Origem</label>
        <input id="r-src" name="source" defaultValue={review?.source ?? ""} className="field" placeholder="Google, Presencial..." />
      </div>
      <ImageUpload name="photo_url" defaultValue={review?.photo_url} folder="reviews" label="Foto (opcional)" aspect="aspect-square max-w-[140px]" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_published" defaultChecked={review?.is_published ?? true} className="h-4 w-4 accent-ink" /> Publicada no site
      </label>
      <div className="flex items-center gap-4">
        <SubmitButton>Salvar</SubmitButton>
        {review ? <button type="button" onClick={onDone} className="text-xs uppercase tracking-[0.2em] text-stone">Cancelar</button> : null}
      </div>
      <FormMessage state={state} />
    </ActionForm>
  );
}
