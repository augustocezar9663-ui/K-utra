"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-screen items-center bg-cream">
      <div className="container-luxe">
        <p className="eyebrow text-accent-deep">Algo saiu do lugar</p>
        <h1 className="mt-6 max-w-2xl text-[clamp(2.6rem,7vw,5rem)] font-light leading-[1]">
          Não foi possível carregar esta página.
        </h1>
        <p className="mt-5 max-w-md text-stone">Tente novamente em instantes. Se o problema continuar, entre em contato pelo WhatsApp.</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button onClick={reset} className="btn btn-primary">Tentar novamente</button>
          <Link href="/" className="btn btn-outline">Voltar ao início</Link>
        </div>
      </div>
    </main>
  );
}
