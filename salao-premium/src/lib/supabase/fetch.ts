/**
 * O cache de dados é feito explicitamente com `"use cache"` + tags
 * (invalidado pelo painel). As requisições HTTP ao Supabase nunca devem
 * entrar no fetch-cache do Next, que persiste entre builds.
 */
export const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });
