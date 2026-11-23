export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** muda a cada execução, para os formulários reagirem */
  at?: number;
};

export const initialState: ActionState = { ok: false };

export function fail(message: string, fieldErrors?: Record<string, string>): ActionState {
  return { ok: false, message, fieldErrors, at: Date.now() };
}

export function done(message = "Alterações salvas."): ActionState {
  return { ok: true, message, at: Date.now() };
}

export function zodFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return Object.fromEntries(issues.map((i) => [String(i.path[0] ?? "form"), i.message]));
}

/** Traduz erros comuns do Postgres/PostgREST em mensagens claras. */
export function dbError(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Já existe um registro com esse identificador (slug).";
  if (error.code === "23P01") return "Conflito de horário: o profissional já possui atendimento nesse período.";
  if (error.code === "23503") return "Este registro está vinculado a outros dados e não pode ser removido.";
  if (error.code === "42501") return "Sem permissão para esta operação.";
  if (error.code === "23514") return "Algum valor está fora do formato permitido.";
  return error.message || "Erro ao salvar.";
}
