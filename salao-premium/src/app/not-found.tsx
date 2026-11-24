import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-ink text-white">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_55%_at_72%_28%,rgb(31_79_214/0.32),transparent_70%)]" />
      <div className="container-luxe relative">
        <p className="eyebrow text-accent">Erro 404</p>
        <h1 className="mt-6 max-w-3xl text-[clamp(3rem,9vw,7rem)] font-light leading-[0.95]">
          Esta página <em className="text-accent">não existe.</em>
        </h1>
        <p className="mt-6 max-w-md text-white/65">
          O endereço pode ter mudado ou sido digitado incorretamente.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn btn-accent">Voltar ao início</Link>
          <Link href="/agendar" className="btn btn-ghost-light">Agendar horário</Link>
        </div>
      </div>
    </main>
  );
}
