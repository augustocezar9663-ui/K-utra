"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { createBlock, deleteBlock } from "@/app/admin/actions/blocks";
import { initialState } from "@/lib/action-result";
import type { BlockedTime } from "@/lib/types";
import { ActionButton } from "./action-button";
import { ActionForm } from "./action-form";
import { FormMessage, SubmitButton } from "./ui";

export function BlocksManager({ blocks, professionals, timezone }: { blocks: BlockedTime[]; professionals: { id: string; name: string }[]; timezone: string }) {
  const [state, action] = useActionState(createBlock, initialState);
  const [allDay, setAllDay] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  const fmt = new Intl.DateTimeFormat("pt-BR", { timeZone: timezone, dateStyle: "short", timeStyle: "short" });

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <ActionForm ref={formRef} action={action} className="space-y-4 self-start border border-line bg-white p-5 sm:p-6">
        <h2 className="text-2xl">Novo bloqueio</h2>
        <div>
          <label className="field-label" htmlFor="b-pro">Aplica-se a</label>
          <select id="b-pro" name="professional_id" className="field">
            <option value="">Salão inteiro (feriado, evento, manutenção)</option>
            {professionals.map((p) => <option key={p.id} value={p.id}>{p.name} (folga, férias)</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="b-ds">Data inicial</label>
            <input id="b-ds" name="date_start" type="date" required className="field" />
          </div>
          <div>
            <label className="field-label" htmlFor="b-de">Data final</label>
            <input id="b-de" name="date_end" type="date" className="field" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="all_day" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="h-4 w-4 accent-ink" />
          Dia(s) inteiro(s)
        </label>
        {!allDay ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="b-ts">Das</label>
              <input id="b-ts" name="time_start" type="time" required className="field" />
            </div>
            <div>
              <label className="field-label" htmlFor="b-te">Até</label>
              <input id="b-te" name="time_end" type="time" required className="field" />
            </div>
          </div>
        ) : null}
        <div>
          <label className="field-label" htmlFor="b-r">Motivo (interno)</label>
          <input id="b-r" name="reason" maxLength={120} className="field" placeholder="Feriado, curso, férias..." />
        </div>
        <SubmitButton>Criar bloqueio</SubmitButton>
        <FormMessage state={state} />
      </ActionForm>

      <div>
        <h2 className="mb-4 text-2xl">Bloqueios ativos e futuros</h2>
        <ul className="divide-y divide-line border border-line bg-white">
          {blocks.length === 0 ? <li className="p-6 text-sm text-stone">Nenhum bloqueio cadastrado.</li> : null}
          {blocks.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">{b.professional_id ? professionals.find((p) => p.id === b.professional_id)?.name ?? "Profissional" : "Salão inteiro"}</p>
                <p className="text-sm text-stone">{fmt.format(new Date(b.starts_at))} → {fmt.format(new Date(b.ends_at))}</p>
                {b.reason ? <p className="text-xs text-stone">{b.reason}</p> : null}
              </div>
              <ActionButton action={deleteBlock} fields={{ id: b.id }} confirmText="Remover este bloqueio?" className="text-xs text-[#a4473b] underline-offset-4 hover:underline">
                Remover
              </ActionButton>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
