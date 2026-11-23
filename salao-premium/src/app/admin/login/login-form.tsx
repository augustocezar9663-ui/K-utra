"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { initialState } from "@/lib/action-result";
import { signIn } from "../actions/auth";

const NOTICES: Record<string, string> = {
  permissao: "Sua conta não tem permissão de administrador.",
  config: "O Supabase ainda não foi configurado. Preencha o arquivo .env.local (veja a documentação).",
};

export function LoginForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState(signIn, initialState);
  // controlado: o React limpa campos não controlados após cada envio
  const [email, setEmail] = useState("");
  const notice = NOTICES[params.get("erro") ?? ""];
  const message = state.message ?? notice;

  return (
    <form action={action} className="mt-10 space-y-5" noValidate>
      {message ? (
        <p role="alert" className="border-l-2 border-[#a4473b] bg-[#a4473b]/5 px-4 py-3 text-sm text-[#7d2f26]">
          {message}
        </p>
      ) : null}
      <div>
        <label htmlFor="email" className="field-label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        {state.fieldErrors?.email ? <p className="mt-2 text-xs text-[#a4473b]">{state.fieldErrors.email}</p> : null}
      </div>
      <div>
        <label htmlFor="password" className="field-label">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        {state.fieldErrors?.password ? <p className="mt-2 text-xs text-[#a4473b]">{state.fieldErrors.password}</p> : null}
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Entrando" : "Entrar"}
      </button>
      <Link href="/" className="link-underline block w-fit pb-1 text-xs text-stone">
        ← Voltar ao site
      </Link>
    </form>
  );
}
