import Link from "next/link";
import { Artwork } from "@/components/ui/artwork";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 opacity-60">
        <Artwork seed="404" tone="ink" />
      </div>
      <div className="container-luxe relative">
        <p className="eyebrow text-champagne">Erro 404</p>
        <h1 className="mt-6 max-w-3xl text-[clamp(3rem,9vw,7rem)] font-light leading-[0.95]">
          Esta página <em className="text-champagne">não existe.</em>
        </h1>
        <p className="mt-6 max-w-md text-white/65">
          O endereço pode ter mudado ou sido digitado incorretamente.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn btn-champagne">Voltar ao início</Link>
          <Link href="/agendar" className="btn btn-ghost-light">Agendar horário</Link>
        </div>
      </div>
    </main>
  );
}
