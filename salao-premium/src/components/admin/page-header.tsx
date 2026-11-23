export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-4xl font-light sm:text-5xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-stone">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`border border-line bg-white p-5 sm:p-7 ${className}`}>
      {title ? <h2 className="mb-5 text-2xl">{title}</h2> : null}
      {children}
    </section>
  );
}
