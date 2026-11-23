"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { deleteService, saveService } from "@/app/admin/actions/services";
import { Media } from "@/components/ui/media";
import { initialState } from "@/lib/action-result";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";
import { ActionButton } from "./action-button";
import { ActionForm } from "./action-form";
import { ImageUpload } from "./image-upload";
import { FieldError, FormMessage, SubmitButton } from "./ui";

export function ServicesManager({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  return (
    <div className="space-y-6">
      <button type="button" onClick={() => setEditing("new")} className="btn btn-primary">
        <Plus className="h-4 w-4" /> Novo serviço
      </button>

      <AnimatePresence>
        {editing ? (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ServiceForm
              key={editing === "new" ? "new" : editing.id}
              service={editing === "new" ? null : editing}
              onDone={() => setEditing(null)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ul className="divide-y divide-line border border-line bg-white">
        {services.length === 0 ? <li className="p-6 text-sm text-stone">Nenhum serviço cadastrado.</li> : null}
        {services.map((s, i) => (
          <li key={s.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <Media src={s.image_url} alt="" seed={s.slug} tone={(["ink", "sand", "champagne", "cream"] as const)[i % 4]} sizes="80px" className="h-20 w-16 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-serif text-xl">
                {s.name}
                {!s.is_active ? <span className="bg-sand px-2 py-0.5 font-sans text-[0.6rem] uppercase tracking-wider text-stone">Inativo</span> : null}
              </p>
              <p className="text-sm text-stone">
                {s.category ? `${s.category} · ` : ""}
                {formatDuration(s.duration_minutes)} · {s.price_from ? "a partir de " : ""}
                {formatPrice(s.price_cents)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setEditing(s)} className="text-xs underline-offset-4 hover:underline">
                Editar
              </button>
              <ActionButton
                action={deleteService}
                fields={{ id: s.id }}
                confirmText={`Excluir "${s.name}"? Agendamentos antigos mantêm o nome do serviço. Prefira desativar se quiser apenas ocultar.`}
                className="text-xs text-[#a4473b] underline-offset-4 hover:underline"
              >
                Excluir
              </ActionButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServiceForm({ service, onDone }: { service: Service | null; onDone: () => void }) {
  const [state, action] = useActionState(saveService, initialState);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <ActionForm action={action} className="grid gap-5 border border-ink bg-white p-5 sm:p-7 md:grid-cols-[220px_1fr]">
      <h2 className="text-2xl md:col-span-2">{service ? `Editar: ${service.name}` : "Novo serviço"}</h2>
      {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <ImageUpload name="image_url" defaultValue={service?.image_url} folder="services" aspect="aspect-[4/5]" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="sv-name">Nome *</label>
          <input id="sv-name" name="name" defaultValue={service?.name} required className="field" />
          <FieldError state={state} name="name" />
        </div>
        <div>
          <label className="field-label" htmlFor="sv-cat">Categoria</label>
          <input id="sv-cat" name="category" defaultValue={service?.category ?? ""} className="field" placeholder="Corte, Cor, Tratamento..." />
        </div>
        <div>
          <label className="field-label" htmlFor="sv-slug">Slug (URL)</label>
          <input id="sv-slug" name="slug" defaultValue={service?.slug} className="field" placeholder="gerado a partir do nome" />
          <FieldError state={state} name="slug" />
        </div>
        <div>
          <label className="field-label" htmlFor="sv-dur">Duração (minutos) *</label>
          <input id="sv-dur" name="duration_minutes" type="number" min={5} max={600} step={5} defaultValue={service?.duration_minutes ?? 60} required className="field" />
          <FieldError state={state} name="duration_minutes" />
        </div>
        <div>
          <label className="field-label" htmlFor="sv-price">Preço (R$) *</label>
          <input
            id="sv-price"
            name="price"
            inputMode="decimal"
            defaultValue={service ? (service.price_cents / 100).toFixed(2).replace(".", ",") : ""}
            required
            className="field"
            placeholder="180,00"
          />
          <FieldError state={state} name="price_cents" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="sv-desc">Descrição</label>
          <textarea id="sv-desc" name="description" rows={3} maxLength={600} defaultValue={service?.description ?? ""} className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="sv-order">Ordem de exibição</label>
          <input id="sv-order" name="sort_order" type="number" min={0} defaultValue={service?.sort_order ?? 0} className="field" />
        </div>
        <div className="flex flex-col justify-end gap-3 pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="price_from" defaultChecked={service?.price_from} className="h-4 w-4 accent-ink" /> Exibir “a partir de”
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={service?.is_active ?? true} className="h-4 w-4 accent-ink" /> Ativo (visível e agendável)
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <SubmitButton>Salvar serviço</SubmitButton>
          <button type="button" onClick={onDone} className="text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">Cancelar</button>
          <FormMessage state={state} />
        </div>
      </div>
    </ActionForm>
  );
}
