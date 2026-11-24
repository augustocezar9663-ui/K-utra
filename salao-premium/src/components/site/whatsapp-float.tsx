"use client";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircleQuestion, CalendarCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { WhatsAppIcon } from "./whatsapp-icon";
import { whatsappLink } from "@/lib/whatsapp";

export function WhatsAppFloat({ number, salonName }: { number: string | null; salonName: string }) {
  const [open, setOpen] = useState(false);
  // Aparece depois da primeira dobra, para não cobrir os botões do topo
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const doubts = whatsappLink(number, `Olá, ${salonName}! Gostaria de tirar uma dúvida.`);
  const confirm = whatsappLink(
    number,
    `Olá, ${salonName}! Fiz um agendamento pelo site e gostaria de solicitar a confirmação.`,
  );
  if (!doubts || !confirm) return null;

  return (
    <motion.div
      className="fixed bottom-5 right-5 z-30 flex flex-col items-end gap-3 sm:bottom-7 sm:right-7"
      inert={!(visible || open)}
      initial={false}
      animate={visible || open ? { opacity: 1, y: 0, pointerEvents: "auto" } : { opacity: 0, y: 16, pointerEvents: "none" }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="w-72 origin-bottom-right bg-white p-2 shadow-[0_20px_60px_-20px_rgba(17,17,17,0.35)]"
            role="menu"
          >
            <p className="px-4 pb-2 pt-3 text-xs text-stone">
              Abre uma conversa no WhatsApp. A mensagem só é enviada quando você tocar em enviar.
            </p>
            <a
              role="menuitem"
              href={doubts}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-cream"
            >
              <MessageCircleQuestion className="h-4 w-4 text-accent-deep" strokeWidth={1.5} />
              Tirar uma dúvida
            </a>
            <a
              role="menuitem"
              href={confirm}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-cream"
            >
              <CalendarCheck className="h-4 w-4 text-accent-deep" strokeWidth={1.5} />
              Solicitar confirmação de horário
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Fechar opções do WhatsApp" : "Falar pelo WhatsApp"}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-[0_14px_40px_-12px_rgba(17,17,17,0.6)] transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-5 w-5" strokeWidth={1.5} /> : <WhatsAppIcon className="h-6 w-6 text-accent" />}
      </button>
    </motion.div>
  );
}
