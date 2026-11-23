"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays, CalendarOff, Images, LayoutDashboard, LogOut, Menu, Scissors, Settings, Star, Users, X, ExternalLink,
} from "lucide-react";
import { signOut } from "@/app/admin/actions/auth";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agendamentos", label: "Agendamentos", icon: CalendarDays },
  { href: "/admin/servicos", label: "Serviços", icon: Scissors },
  { href: "/admin/profissionais", label: "Profissionais", icon: Users },
  { href: "/admin/bloqueios", label: "Bloqueios e feriados", icon: CalendarOff },
  { href: "/admin/galeria", label: "Galeria", icon: Images },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminSidebar({ salonName }: { salonName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Painel" className="flex flex-1 flex-col">
      <ul className="space-y-1">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={() => setOpen(false)}
              aria-current={isActive(href) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 px-4 text-sm transition-colors ${
                isActive(href) ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <Link href="/" target="_blank" className="flex min-h-11 items-center gap-3 px-4 text-sm text-white/60 hover:text-white">
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} /> Ver site
        </Link>
        <form action={signOut}>
          <button type="submit" className="flex min-h-11 w-full items-center gap-3 px-4 text-sm text-white/60 hover:text-white">
            <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sair
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-ink px-4 text-white lg:hidden">
        <span className="font-serif text-xl">{salonName}</span>
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="flex h-11 w-11 items-center justify-center">
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 bg-ink/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ink px-3 py-6 text-white transition-transform duration-500 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-4">
          <div>
            <p className="font-serif text-2xl">{salonName}</p>
            <p className="eyebrow mt-1 text-[0.58rem] text-champagne">Painel</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="flex h-10 w-10 items-center justify-center lg:hidden">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        {nav}
      </aside>
    </>
  );
}
