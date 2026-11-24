"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useActionPending } from "./action-form";
import type { ActionState } from "@/lib/action-result";
import type { AppointmentStatus } from "@/lib/types";

export function SubmitButton({ children, className = "btn btn-primary", pendingLabel = "Salvando" }: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const status = useFormStatus();
  const actionPending = useActionPending();
  const pending = status.pending || actionPending;
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  return (
    <AnimatePresence mode="wait">
      {state.message ? (
        <motion.p
          key={state.at}
          role={state.ok ? "status" : "alert"}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-center gap-2 text-sm ${state.ok ? "text-[#3d6b4a]" : "text-[#a4473b]"}`}
        >
          {state.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {state.message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

export function FieldError({ state, name }: { state: ActionState; name: string }) {
  const msg = state.fieldErrors?.[name];
  return msg ? <p className="mt-1.5 text-xs text-[#a4473b]">{msg}</p> : null;
}

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: "bg-accent/30 text-[#1e3a8a]",
  confirmed: "bg-[#e3ece4] text-[#2f5a3b]",
  completed: "bg-ink text-white",
  cancelled: "bg-[#f3e3e0] text-[#8a3a30]",
  no_show: "bg-sand text-stone",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
