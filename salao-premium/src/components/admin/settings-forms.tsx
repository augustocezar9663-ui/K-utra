"use client";

import { useActionState } from "react";
import { saveScheduleRules, saveSettings } from "@/app/admin/actions/settings";
import { initialState } from "@/lib/action-result";
import type { BusinessSettings, WorkingHour } from "@/lib/types";
import { HoursEditor } from "./hours-editor";
import { ActionForm } from "./action-form";
import { ImageUpload } from "./image-upload";
import { FieldError, FormMessage, SubmitButton } from "./ui";

function Input({ name, label, defaultValue, state, ...rest }: { name: string; label: string; defaultValue?: string | number | null; state: Parameters<typeof FieldError>[0]["state"] } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name">) {
  return (
    <div className={rest.className}>
      <label className="field-label" htmlFor={`s-${name}`}>{label}</label>
      <input id={`s-${name}`} name={name} defaultValue={defaultValue ?? ""} {...rest} className="field" />
      <FieldError state={state} name={name} />
    </div>
  );
}

export function SettingsForm({ s }: { s: BusinessSettings }) {
  const [state, action] = useActionState(saveSettings, initialState);
  return (
    <ActionForm action={action} className="space-y-10">
      <section className="border border-line bg-white p-5 sm:p-7">
        <h2 className="mb-5 text-2xl">Identidade</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="name" label="Nome do salão *" defaultValue={s.name} state={state} required />
          <Input name="tagline" label="Assinatura (abaixo do nome)" defaultValue={s.tagline} state={state} maxLength={40} />
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="s-description">Descrição (SEO e dados estruturados)</label>
            <textarea id="s-description" name="description" rows={3} maxLength={600} defaultValue={s.description ?? ""} className="field" />
          </div>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <ImageUpload name="logo_url" defaultValue={s.logo_url} folder="brand" label="Logotipo (PNG/SVG transparente)" aspect="aspect-[3/1]" />
          <ImageUpload name="hero_image_url" defaultValue={s.hero_image_url} folder="brand" label="Foto principal (hero)" aspect="aspect-video" />
        </div>
      </section>

      <section className="border border-line bg-white p-5 sm:p-7">
        <h2 className="mb-5 text-2xl">Endereço</h2>
        <div className="grid gap-4 sm:grid-cols-6">
          <Input name="address_street" label="Rua / Avenida" defaultValue={s.address_street} state={state} className="sm:col-span-4" />
          <Input name="address_number" label="Número" defaultValue={s.address_number} state={state} className="sm:col-span-2" />
          <Input name="address_complement" label="Complemento" defaultValue={s.address_complement} state={state} className="sm:col-span-3" />
          <Input name="address_neighborhood" label="Bairro" defaultValue={s.address_neighborhood} state={state} className="sm:col-span-3" />
          <Input name="address_city" label="Cidade" defaultValue={s.address_city} state={state} className="sm:col-span-3" />
          <Input name="address_state" label="UF" defaultValue={s.address_state} state={state} maxLength={2} className="sm:col-span-1" />
          <Input name="address_zip" label="CEP" defaultValue={s.address_zip} state={state} className="sm:col-span-2" />
          <Input name="latitude" label="Latitude (opcional)" defaultValue={s.latitude} state={state} inputMode="decimal" className="sm:col-span-3" />
          <Input name="longitude" label="Longitude (opcional)" defaultValue={s.longitude} state={state} inputMode="decimal" className="sm:col-span-3" />
        </div>
        <p className="mt-3 text-xs text-stone">O mapa e o botão “Como chegar” usam o endereço (ou as coordenadas, quando informadas).</p>
      </section>

      <section className="border border-line bg-white p-5 sm:p-7">
        <h2 className="mb-5 text-2xl">Contato e redes sociais</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="phone" label="Telefone com DDD" defaultValue={s.phone} state={state} inputMode="tel" placeholder="1133334444" />
          <Input name="whatsapp" label="WhatsApp com DDD" defaultValue={s.whatsapp} state={state} inputMode="tel" placeholder="11999999999" />
          <Input name="email" label="E-mail" defaultValue={s.email} state={state} type="email" />
          <Input name="instagram" label="Instagram (usuário)" defaultValue={s.instagram} state={state} placeholder="seusalao" />
          <Input name="facebook" label="Facebook (URL)" defaultValue={s.facebook} state={state} type="url" />
          <Input name="tiktok" label="TikTok (URL)" defaultValue={s.tiktok} state={state} type="url" />
        </div>
      </section>

      <section className="border border-line bg-white p-5 sm:p-7">
        <h2 className="mb-5 text-2xl">Política de cancelamento</h2>
        <textarea name="cancellation_policy" rows={4} maxLength={1200} defaultValue={s.cancellation_policy ?? ""} className="field" aria-label="Política de cancelamento" />
        <p className="mt-2 text-xs text-stone">Exibida na confirmação do agendamento e no e-mail.</p>
      </section>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 border-t border-line bg-cream/95 py-4 backdrop-blur">
        <SubmitButton>Salvar configurações</SubmitButton>
        <FormMessage state={state} />
      </div>
    </ActionForm>
  );
}

export function ScheduleForm({ s, hours }: { s: BusinessSettings; hours: WorkingHour[] }) {
  const [state, action] = useActionState(saveScheduleRules, initialState);
  return (
    <ActionForm action={action} className="space-y-6 border border-line bg-white p-5 sm:p-7">
      <h2 className="text-2xl">Horário de funcionamento e regras da agenda</h2>
      <HoursEditor initial={hours.filter((h) => h.professional_id === null)} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="field-label" htmlFor="r-int">Intervalo da grade</label>
          <select id="r-int" name="slot_interval_minutes" defaultValue={s.slot_interval_minutes} className="field">
            {[10, 15, 20, 30, 45, 60].map((n) => <option key={n} value={n}>{n} minutos</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="r-min">Antecedência mínima (horas)</label>
          <input id="r-min" name="min_advance_hours" type="number" min={0} max={168} step={0.5} defaultValue={s.min_advance_minutes / 60} className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="r-max">Agendar até (dias à frente)</label>
          <input id="r-max" name="max_advance_days" type="number" min={1} max={365} defaultValue={s.max_advance_days} className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="r-tz">Fuso horário</label>
          <input id="r-tz" name="timezone" defaultValue={s.timezone} className="field" />
          <FieldError state={state} name="timezone" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="auto_confirm" defaultChecked={s.auto_confirm} className="h-4 w-4 accent-ink" />
        Confirmar agendamentos automaticamente (sem isso, entram como “pendente” para confirmação manual)
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Salvar horários e regras</SubmitButton>
        <FormMessage state={state} />
      </div>
    </ActionForm>
  );
}
