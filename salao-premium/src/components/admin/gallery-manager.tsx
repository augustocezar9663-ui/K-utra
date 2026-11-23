"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { deleteGalleryImage, saveGalleryImage } from "@/app/admin/actions/content";
import { initialState } from "@/lib/action-result";
import type { GalleryImage } from "@/lib/types";
import { ActionButton } from "./action-button";
import { ActionForm } from "./action-form";
import { ImageUpload } from "./image-upload";
import { FieldError, FormMessage, SubmitButton } from "./ui";

export function GalleryManager({ images }: { images: GalleryImage[] }) {
  const [editing, setEditing] = useState<GalleryImage | null>(null);
  const [formKey, setFormKey] = useState(0);
  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <GalleryForm
        key={editing?.id ?? `new-${formKey}`}
        image={editing}
        onDone={() => {
          setEditing(null);
          setFormKey((k) => k + 1);
        }}
      />
      <ul className="grid grid-cols-2 gap-3 self-start sm:grid-cols-3">
        {images.length === 0 ? <li className="col-span-full border border-line bg-white p-6 text-sm text-stone">Nenhuma imagem na galeria.</li> : null}
        {images.map((img) => (
          <li key={img.id} className={`border bg-white ${editing?.id === img.id ? "border-ink" : "border-line"}`}>
            <div className="relative aspect-square">
              <Image src={img.image_url} alt={img.alt} fill sizes="200px" className={`object-cover ${img.is_active ? "" : "opacity-40"}`} />
            </div>
            <div className="flex items-center justify-between gap-2 p-2 text-xs">
              <span className="truncate text-stone">{img.category ?? "—"}</span>
              <span className="flex gap-3">
                <button type="button" onClick={() => setEditing(img)} className="hover:underline">Editar</button>
                <ActionButton action={deleteGalleryImage} fields={{ id: img.id }} confirmText="Remover esta imagem da galeria?" className="text-[#a4473b] hover:underline">
                  Remover
                </ActionButton>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GalleryForm({ image, onDone }: { image: GalleryImage | null; onDone: () => void }) {
  const [state, action] = useActionState(saveGalleryImage, initialState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);
  return (
    <ActionForm action={action} className="space-y-4 self-start border border-line bg-white p-5">
      <h2 className="text-2xl">{image ? "Editar imagem" : "Adicionar imagem"}</h2>
      {image ? <input type="hidden" name="id" value={image.id} /> : null}
      <ImageUpload name="image_url" defaultValue={image?.image_url} folder="gallery" label="Fotografia *" aspect="aspect-[4/3]" />
      <FieldError state={state} name="image_url" />
      <div>
        <label className="field-label" htmlFor="g-alt">Descrição (acessibilidade)</label>
        <input id="g-alt" name="alt" defaultValue={image?.alt} maxLength={160} className="field" placeholder="Ex.: mechas loiras em cabelo ondulado" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="g-cat">Categoria</label>
          <input id="g-cat" name="category" defaultValue={image?.category ?? ""} className="field" placeholder="Cor, Corte..." />
        </div>
        <div>
          <label className="field-label" htmlFor="g-ord">Ordem</label>
          <input id="g-ord" name="sort_order" type="number" min={0} defaultValue={image?.sort_order ?? 0} className="field" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={image?.is_active ?? true} className="h-4 w-4 accent-ink" /> Visível no site
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Salvar</SubmitButton>
        {image ? <button type="button" onClick={onDone} className="text-xs uppercase tracking-[0.2em] text-stone">Cancelar</button> : null}
      </div>
      <FormMessage state={state} />
    </ActionForm>
  );
}
