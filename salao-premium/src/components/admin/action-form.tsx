"use client";

import { createContext, useContext, useTransition } from "react";

const PendingContext = createContext(false);
export const useActionPending = () => useContext(PendingContext);

/**
 * Formulário para Server Actions que NÃO limpa os campos após o envio
 * (o comportamento padrão do React 19 com `<form action>` reseta campos
 * não controlados — o usuário perderia o que digitou se a validação falhar).
 */
export function ActionForm({
  action,
  children,
  ...props
}: Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit"> & {
  action: (fd: FormData) => void;
  ref?: React.Ref<HTMLFormElement>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <PendingContext value={pending}>
      <form
        {...props}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd));
        }}
      >
        {children}
      </form>
    </PendingContext>
  );
}
