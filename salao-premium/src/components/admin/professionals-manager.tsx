"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { deleteProfessional, saveProfessional } from "@/app/admin/actions/professionals";
import { Media } from "@/components/ui/media";
import { initialState } from "@/lib/action-result";
import type { Professional, Service, WorkingHour } from "@/lib/types";
import { ActionButton } from "./action-button";
import { HoursEditor } from "./hours-editor";
import { ActionForm } from "./action-form";
import { ImageUpload } from "./image-upload";
import { FieldError, FormMessage, SubmitButton } from "./ui";

interface Props {
  professionals: (Professional & { service_ids: string[] })[];
  services: Service[];
  hours: WorkingHour[];
}

export function ProfessionalsManager({ professionals, services, hours }: Props) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const current = professionals.find((p) => p.id === editing) ?? null;
  const salonHours = hours.filter((h) => h.professional_id === null);

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => setEditing("new")} className="btn btn-primary">
        <Plus className="h-4 w-4" /> Novo profissional
      </button>
      <AnimatePresence>
        {editing ? (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ProfessionalForm
              key={editing}
              pro={current}
              services={services}
              ownHours={current ? hours.filter((h) => h.professional_id === current.id) : []}
              salonHours={salonHours}
              onDone={() => setEditing(null)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {professionals.length === 0 ? (
          <li className="border border-line bg-white p-6 text-sm text-stone sm:col-span-2 lg:col-span-3">
            Nenhum profissional cadastrado. Cadastre a equipe para liberar o agendamento online.
          </li>
        ) : null}
        {professionals.map((p, i) => {
          const custom = hours.some((h) => h.professional_id === p.id);
          return (
            <li key={p.id} className="flex gap-4 border border-line bg-white p-4">
              <Media src={p.photo_url} alt="" seed={p.slug} tone={i % 2 ? "accent" : "sand"} sizes="80px" className="h-24 w-20 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-xl leading-tight">{p.name}</p>
                <p className="text-xs text-stone">{p.specialty ?? "—"}</p>
                <p className="mt-2 text-xs text-stone">
                  {p.service_ids.length} serviço(s) · {custom ? "jornada própria" : "horário do salão"}
                  {!p.is_active ? " · inativo" : ""}
                </p>
                <div className="mt-3 flex gap-4">
                  <button type="button" onClick={() => setEditing(p.id)} className="text-xs underline-offset-4 hover:underline">
                    Editar
                  </button>
                  <ActionButton
                    action={deleteProfessional}
                    fields={{ id: p.id }}
                    confirmText={`Excluir ${p.name}?`}
                    className="text-xs text-[#a4473b] underline-offset-4 hover:underline"
                  >
                    Excluir
                  </ActionButton>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProfessionalForm({
  pro,
  services,
  ownHours,
  salonHours,
  onDone,
}: {
  pro: (Professional & { service_ids: string[] }) | null;
  services: Service[];
  ownHours: WorkingHour[];
  salonHours: WorkingHour[];
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveProfessional, initialState);
  const [custom, setCustom] = useState(ownHours.length > 0);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <ActionForm action={action} className="space-y-8 border border-ink bg-white p-5 sm:p-7">
      <h2 className="text-2xl">{pro ? `Editar: ${pro.name}` : "Novo profissional"}</h2>
      {pro ? <input type="hidden" name="id" value={pro.id} /> : null}
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        <ImageUpload name="photo_url" defaultValue={pro?.photo_url} folder="professionals" label="Fotografia" aspect="aspect-[3/4]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="pf-name">Nome *</label>
            <input id="pf-name" name="name" defaultValue={pro?.name} required className="field" />
            <FieldError state={state} name="name" />
          </div>
          <div>
            <label className="field-label" htmlFor="pf-spec">Especialidade</label>
            <input id="pf-spec" name="specialty" defaultValue={pro?.specialty ?? ""} className="field" placeholder="Colorista, Visagista..." />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="pf-bio">Apresentação</label>
            <textarea id="pf-bio" name="bio" rows={3} maxLength={800} defaultValue={pro?.bio ?? ""} className="field" />
          </div>
          <div>
            <label className="field-label" htmlFor="pf-ig">Instagram</label>
            <input id="pf-ig" name="instagram" defaultValue={pro?.instagram ?? ""} className="field" placeholder="usuario" />
          </div>
          <div>
            <label className="field-label" htmlFor="pf-slug">Slug</label>
            <input id="pf-slug" name="slug" defaultValue={pro?.slug} className="field" placeholder="gerado a partir do nome" />
            <FieldError state={state} name="slug" />
          </div>
          <div>
            <label className="field-label" htmlFor="pf-order">Ordem</label>
            <input id="pf-order" name="sort_order" type="number" min={0} defaultValue={pro?.sort_order ?? 0} className="field" />
          </div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={pro?.is_active ?? true} className="h-4 w-4 accent-ink" />
            Ativo (aparece no site e no agendamento)
          </label>
        </div>
      </div>

      <fieldset>
        <legend className="field-label">Serviços realizados</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <label key={s.id} className="flex min-h-11 cursor-pointer items-center gap-3 border border-line px-3 text-sm has-[:checked]:border-ink">
              <input
                type="checkbox"
                name="service_ids"
                value={s.id}
                defaultChecked={pro ? pro.service_ids.includes(s.id) : true}
                className="h-4 w-4 accent-ink"
              />
              {s.name}
              {!s.is_active ? <span className="text-xs text-stone">(inativo)</span> : null}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="field-label">Disponibilidade semanal</legend>
        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="custom_hours"
            checked={custom}
            onChange={(e) => setCustom(e.target.checked)}
            className="h-4 w-4 accent-ink"
          />
          Definir jornada individual (sempre limitada ao horário de funcionamento do salão)
        </label>
        {custom ? (
          <HoursEditor initial={ownHours.length ? ownHours : salonHours} />
        ) : (
          <p className="text-sm text-stone">Segue o horário de funcionamento do salão. Folgas e férias são cadastradas em “Bloqueios e feriados”.</p>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Salvar profissional</SubmitButton>
        <button type="button" onClick={onDone} className="text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">Cancelar</button>
        <FormMessage state={state} />
      </div>
    </ActionForm>
  );
}
