"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { type ActionState, initialState } from "@/lib/action-result";

/** Botão que dispara uma Server Action com campos ocultos (e confirmação opcional). */
export function ActionButton({
  action,
  fields,
  children,
  confirmText,
  className = "text-xs underline-offset-4 hover:underline",
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
      className="inline"
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" disabled={pending} className={`${className} inline-flex items-center gap-1.5 disabled:opacity-50`}>
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        {children}
      </button>
      {!state.ok && state.message ? <span role="alert" className="ml-2 text-xs text-[#a4473b]">{state.message}</span> : null}
    </form>
  );
}
