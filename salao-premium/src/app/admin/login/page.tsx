import { Suspense } from "react";
import { Artwork } from "@/components/ui/artwork";
import { getSettings } from "@/lib/data/public";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  const s = await getSettings();
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-ink lg:block">
        <Artwork seed="admin-login" tone="ink" />
        <div className="absolute bottom-12 left-12 text-white">
          <p className="font-serif text-4xl">{s.name}</p>
          <p className="eyebrow mt-2 text-champagne">Painel administrativo</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="eyebrow text-champagne-deep">Acesso restrito</p>
          <h1 className="mt-4 text-5xl font-light">Entrar</h1>
          <p className="mt-3 text-sm text-stone">Use a conta de administrador cadastrada no Supabase.</p>
          <Suspense fallback={<div className="skeleton mt-10 h-64" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
