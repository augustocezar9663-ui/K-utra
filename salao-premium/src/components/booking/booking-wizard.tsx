"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Media } from "@/components/ui/media";
import { formatDateLong, formatDuration, formatPrice, maskPhone, onlyDigits } from "@/lib/format";
import { DUR, EASE_OUT as EASE } from "@/lib/motion";
import { addDaysToKey, dateKeyOf } from "@/lib/time";
import type { BookingResult, ProfessionalWithServices, Service } from "@/lib/types";
import { customerSchema } from "@/lib/validation";
import { Calendar } from "./calendar";
import { BookingSuccess } from "./success";

export interface SalonInfo {
  name: string;
  whatsapp: string | null;
  timezone: string;
  address: string;
  cancellationPolicy: string | null;
  maxAdvanceDays: number;
  configured: boolean;
}

interface SlotDTO {
  time: string;
  startsAt: string;
  professionalIds: string[];
}

const STEPS = ["Serviços", "Profissional", "Data", "Horário", "Seus dados", "Confirmação"] as const;

type Customer = { name: string; phone: string; whatsapp: string; email: string; notes: string };
const EMPTY_CUSTOMER: Customer = { name: "", phone: "", whatsapp: "", email: "", notes: "" };

export function BookingWizard({
  services,
  professionals,
  salon,
}: {
  services: Service[];
  professionals: ProfessionalWithServices[];
  salon: SalonInfo;
}) {
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const tz = salon.timezone;
  const topRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [serviceIds, setServiceIds] = useState<string[]>(() => {
    const slug = params.get("servico");
    const s = services.find((x) => x.slug === slug);
    return s ? [s.id] : [];
  });
  const [chosenProfessionalId, setProfessionalId] = useState<string | null>(() => {
    const p = params.get("profissional");
    return professionals.some((x) => x.id === p) ? p : null;
  });
  const [todayKey] = useState(() => dateKeyOf(new Date(), tz));
  const [month, setMonth] = useState(() => todayKey.slice(0, 7));
  const [monthDir, setMonthDir] = useState<1 | -1>(1);
  const [daysData, setDaysData] = useState<{ key: string; days: Record<string, number> } | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slotsData, setSlotsData] = useState<{ key: string; slots: SlotDTO[] } | null>(null);
  const [slotsNonce, setSlotsNonce] = useState(0);
  const [slot, setSlot] = useState<SlotDTO | null>(null);
  const [customer, setCustomer] = useState<Customer>(EMPTY_CUSTOMER);
  const [sameWhatsapp, setSameWhatsapp] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fetchErr, setFetchErr] = useState<{ key: string; message: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  const selected = useMemo(
    () => serviceIds.map((id) => services.find((s) => s.id === id)).filter(Boolean) as Service[],
    [serviceIds, services],
  );
  const totalDuration = selected.reduce((a, s) => a + s.duration_minutes, 0);
  const totalPrice = selected.reduce((a, s) => a + s.price_cents, 0);
  const anyFrom = selected.some((s) => s.price_from);

  const eligible = useMemo(
    () =>
      professionals.filter((p) => serviceIds.length > 0 && serviceIds.every((id) => p.service_ids.includes(id))),
    [professionals, serviceIds],
  );
  // Se o profissional escolhido não realiza a combinação, vale "primeira disponibilidade"
  const professionalId = chosenProfessionalId && eligible.some((p) => p.id === chosenProfessionalId) ? chosenProfessionalId : null;
  const professional = professionals.find((p) => p.id === professionalId) ?? null;
  const maxMonth = addDaysToKey(todayKey, salon.maxAdvanceDays).slice(0, 7);

  // Um serviço só pode ser adicionado se algum profissional realizar todos os escolhidos
  const isCompatible = useCallback(
    (id: string) => {
      const ids = serviceIds.includes(id) ? serviceIds : [...serviceIds, id];
      return professionals.some((p) => ids.every((x) => p.service_ids.includes(x)));
    },
    [professionals, serviceIds],
  );

  const scheduleKey = `${serviceIds.join(",")}|${professionalId ?? "any"}`;
  const daysKey = `${scheduleKey}|${month}`;
  const slotsKey = `${scheduleKey}|${date}|${slotsNonce}`;
  const days = daysData?.key === daysKey ? daysData.days : null;
  const daysLoading = step === 2 && !days && fetchErr?.key !== daysKey;
  const slots = slotsData?.key === slotsKey ? slotsData.slots : null;
  const slotsLoading = step === 3 && !slots && fetchErr?.key !== slotsKey;
  const fetchError = fetchErr && (fetchErr.key === daysKey || fetchErr.key === slotsKey) ? fetchErr.message : null;

  // Mudar serviços ou profissional invalida data e horário escolhidos
  function resetSchedule() {
    setDate(null);
    setSlot(null);
  }
  function toggleService(id: string) {
    resetSchedule();
    setServiceIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }
  function chooseProfessional(id: string | null) {
    if (id !== professionalId) resetSchedule();
    setProfessionalId(id);
  }

  const query = useCallback(
    (extra: Record<string, string>) =>
      new URLSearchParams({ services: serviceIds.join(","), professional: professionalId ?? "any", ...extra }),
    [serviceIds, professionalId],
  );

  // Dias disponíveis do mês
  useEffect(() => {
    if (step !== 2 || !serviceIds.length) return;
    const ctrl = new AbortController();
    const key = daysKey;
    fetch(`/api/availability?${query({ month })}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Erro ao consultar a agenda.");
        setDaysData({ key, days: data.days ?? {} });
      })
      .catch((e) => {
        if (e.name !== "AbortError") setFetchErr({ key, message: e.message });
      });
    return () => ctrl.abort();
  }, [step, month, query, serviceIds.length, daysKey]);

  // Horários do dia (consultados novamente sempre que a etapa é aberta)
  useEffect(() => {
    if (step !== 3 || !date) return;
    const ctrl = new AbortController();
    const key = slotsKey;
    fetch(`/api/availability?${query({ date })}`, { signal: ctrl.signal, cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Erro ao consultar horários.");
        const list = (data.slots ?? []) as SlotDTO[];
        setSlotsData({ key, slots: list });
        setSlot((cur) => (cur && list.some((s) => s.startsAt === cur.startsAt) ? cur : null));
      })
      .catch((e) => {
        if (e.name !== "AbortError") setFetchErr({ key, message: e.message });
      });
    return () => ctrl.abort();
  }, [step, date, query, slotsKey]);

  function goTo(next: number) {
    if (next === 3) setSlotsNonce((n) => n + 1);
    setDir(next > step ? 1 : -1);
    setStep(next);
    setSubmitError(null);
    requestAnimationFrame(() => {
      const top = topRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0 || top > window.innerHeight * 0.4) {
        window.scrollTo({ top: window.scrollY + top - 96, behavior: reduce ? "auto" : "smooth" });
      }
    });
  }

  function validateCustomer() {
    const parsed = customerSchema.safeParse({
      ...customer,
      whatsapp: sameWhatsapp ? customer.phone : customer.whatsapp,
    });
    if (parsed.success) {
      setErrors({});
      return true;
    }
    setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
    return false;
  }

  const canContinue = [
    serviceIds.length > 0,
    eligible.length > 0,
    Boolean(date),
    Boolean(slot),
    true,
    true,
  ][step];

  function next() {
    if (step === 4 && !validateCustomer()) return;
    if (canContinue) goTo(step + 1);
  }

  async function confirm() {
    if (!slot || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceIds,
          professionalId,
          startsAt: slot.startsAt,
          customer: {
            name: customer.name,
            phone: onlyDigits(customer.phone),
            whatsapp: onlyDigits(sameWhatsapp ? customer.phone : customer.whatsapp),
            email: customer.email,
            notes: customer.notes,
          },
          website: honeypot || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 || data.code === "TOO_SOON" || data.code === "OUTSIDE_HOURS") {
          setSlot(null);
          setSlotsNonce((n) => n + 1);
          setSubmitError(data.error);
          setDir(-1);
          setStep(3);
          return;
        }
        throw new Error(data.error ?? "Não foi possível concluir o agendamento.");
      }
      setResult(data as BookingResult);
      setDir(1);
      setStep(6);
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setServiceIds([]);
    setProfessionalId(null);
    setCustomer(EMPTY_CUSTOMER);
    setSameWhatsapp(true);
    setErrors({});
    setDir(-1);
    setStep(0);
  }

  if (!salon.configured) {
    return (
      <div className="mx-auto max-w-xl border border-line bg-white p-10 text-center">
        <p className="label text-accent-deep">Em breve</p>
        <h2 className="mt-4 text-4xl font-light">Agendamento online em configuração</h2>
        <p className="mt-4 text-stone">
          Enquanto isso, fale com a nossa equipe para reservar o seu horário.
        </p>
        <Link href="/#contato" className="btn btn-primary mt-8">
          Ver contatos
        </Link>
      </div>
    );
  }

  if (step === 6 && result) {
    return (
      <BookingSuccess
        result={result}
        services={selected.map((s) => s.name)}
        customerName={customer.name.trim()}
        salon={salon}
        onNew={reset}
      />
    );
  }

  // troca de etapa rápida (interface < 300 ms): a saída é mais curta que a
  // entrada para não deixar a área em branco entre uma etapa e outra
  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 24 }),
    center: { opacity: 1, x: 0, transition: { duration: DUR.step, ease: EASE } },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -16, transition: { duration: 0.14, ease: EASE } }),
  };

  const slotGroups = groupSlots(slots ?? []);

  return (
    <div ref={topRef} className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-8">
        <Progress step={step} onJump={(i) => i < step && goTo(i)} />

        <div className="relative mt-10 min-h-[420px] overflow-x-clip">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {step === 0 && (
                <StepShell title="Escolha o serviço" hint="Você pode combinar mais de um serviço compatível no mesmo atendimento.">
                  {services.length === 0 ? (
                    <EmptyNote>Nenhum serviço disponível para agendamento online no momento.</EmptyNote>
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {services.map((s, i) => {
                        const active = serviceIds.includes(s.id);
                        const compatible = active || isCompatible(s.id);
                        return (
                          <li key={s.id}>
                            <button
                              type="button"
                              aria-pressed={active}
                              disabled={!compatible}
                              onClick={() => toggleService(s.id)}
                              className={`group relative flex h-full w-full items-stretch gap-4 border p-3 text-left transition-[border-color,box-shadow,opacity,transform] duration-200 ease-out active:scale-[0.985] ${
                                active
                                  ? "border-ink bg-white shadow-[0_18px_40px_-28px_rgba(17,17,17,0.55)]"
                                  : "border-line bg-white hover:border-ink/40"
                              } disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                              <Media
                                src={s.image_url}
                                alt=""
                                seed={s.slug}
                                tone={(["ink", "sand", "accent", "cream"] as const)[i % 4]}
                                sizes="88px"
                                className="h-auto min-h-24 w-20 shrink-0 sm:w-22"
                              />
                              <span className="flex flex-1 flex-col py-1 pr-8">
                                <span className="font-serif text-[1.35rem] leading-tight">{s.name}</span>
                                <span className="mt-1 flex items-center gap-1.5 text-xs text-stone">
                                  <Clock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                                  {formatDuration(s.duration_minutes)}
                                </span>
                                <span className="mt-auto pt-2 text-sm font-semibold">
                                  {s.price_from ? <span className="mr-1 text-xs font-normal text-stone">a partir de</span> : null}
                                  {formatPrice(s.price_cents)}
                                </span>
                                {!compatible ? (
                                  <span className="mt-1 text-[0.7rem] text-stone">Não combinável com a seleção atual</span>
                                ) : null}
                              </span>
                              <span
                                className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border transition-[transform,background-color,border-color,color] duration-200 ease-out ${
                                  active ? "scale-100 border-ink bg-ink text-white" : "scale-90 border-line text-transparent"
                                }`}
                                aria-hidden="true"
                              >
                                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </StepShell>
              )}

              {step === 1 && (
                <StepShell title="Escolha o profissional" hint="Selecione quem vai cuidar de você ou deixe que encontremos o primeiro horário livre.">
                  {eligible.length === 0 ? (
                    <EmptyNote>
                      Ainda não há profissionais disponíveis para esta combinação de serviços. Volte e ajuste sua
                      seleção ou fale conosco pelo WhatsApp.
                    </EmptyNote>
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      <li className="sm:col-span-2">
                        <ChoiceCard active={professionalId === null} onClick={() => chooseProfessional(null)}>
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-ink text-accent">
                            <Sparkles className="h-5 w-5" strokeWidth={1.25} />
                          </span>
                          <span>
                            <span className="block font-serif text-[1.4rem] leading-tight">Primeira disponibilidade</span>
                            <span className="mt-1 block text-sm text-stone">
                              Mostramos todos os horários livres entre {eligible.length}{" "}
                              {eligible.length > 1 ? "profissionais qualificados" : "profissional qualificado"}.
                            </span>
                          </span>
                        </ChoiceCard>
                      </li>
                      {eligible.map((p, i) => (
                        <li key={p.id}>
                          <ChoiceCard active={professionalId === p.id} onClick={() => chooseProfessional(p.id)}>
                            <Media
                              src={p.photo_url}
                              alt={`Foto de ${p.name}`}
                              seed={p.slug}
                              tone={i % 2 ? "accent" : "sand"}
                              sizes="72px"
                              className="h-20 w-16 shrink-0"
                            />
                            <span className="min-w-0">
                              {p.specialty ? <span className="label block text-accent-deep">{p.specialty}</span> : null}
                              <span className="mt-1 block font-serif text-[1.4rem] leading-tight">{p.name}</span>
                              {p.bio ? <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-stone">{p.bio}</span> : null}
                            </span>
                          </ChoiceCard>
                        </li>
                      ))}
                    </ul>
                  )}
                </StepShell>
              )}

              {step === 2 && (
                <StepShell title="Escolha a data" hint="Os dias destacados possuem horários livres para o seu atendimento.">
                  <div className="border border-line bg-white p-4 sm:p-8">
                    <Calendar
                      month={month}
                      onMonthChange={(m, d) => {
                        setMonthDir(d);
                        setMonth(m);
                      }}
                      minMonth={todayKey.slice(0, 7)}
                      maxMonth={maxMonth}
                      todayKey={todayKey}
                      availableDays={days}
                      loading={daysLoading}
                      selected={date}
                      onSelect={(k) => {
                        if (k !== date) setSlot(null);
                        setDate(k);
                      }}
                      direction={monthDir}
                    />
                    {!daysLoading && days && Object.keys(days).length === 0 && !fetchError ? (
                      <p className="mt-6 border-t border-line pt-5 text-sm text-stone">
                        Não há horários livres neste mês para a combinação escolhida. Tente o próximo mês.
                      </p>
                    ) : null}
                  </div>
                  {fetchError ? <ErrorNote>{fetchError}</ErrorNote> : null}
                </StepShell>
              )}

              {step === 3 && (
                <StepShell
                  title="Escolha o horário"
                  hint={date ? `Horários livres para ${formatDateLong(`${date}T12:00:00Z`, "UTC")}.` : undefined}
                >
                  {submitError ? <ErrorNote>{submitError}</ErrorNote> : null}
                  {fetchError ? <ErrorNote>{fetchError}</ErrorNote> : null}
                  {slotsLoading && !slots ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-busy="true" aria-label="Carregando horários">
                      {Array.from({ length: 10 }, (_, i) => (
                        <span key={i} className="skeleton h-12" />
                      ))}
                    </div>
                  ) : slots && slots.length === 0 ? (
                    <EmptyNote>
                      Os horários deste dia foram preenchidos.{" "}
                      <button type="button" className="underline" onClick={() => goTo(2)}>
                        Escolha outra data
                      </button>
                      .
                    </EmptyNote>
                  ) : (
                    <div className={`space-y-8 transition-opacity ${slotsLoading ? "opacity-50" : ""}`}>
                      {slotGroups.map((g) => (
                        <div key={g.label}>
                          <p className="label mb-3 text-stone">{g.label}</p>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                            {g.slots.map((s) => {
                              const active = slot?.startsAt === s.startsAt;
                              return (
                                <motion.button
                                  key={s.startsAt}
                                  type="button"
                                  whileTap={{ scale: 0.96 }}
                                  aria-pressed={active}
                                  onClick={() => setSlot(s)}
                                  className={`h-12 border text-[0.95rem] tabular-nums transition-colors duration-300 ${
                                    active
                                      ? "border-ink bg-ink text-white"
                                      : "border-line bg-white hover:border-ink"
                                  }`}
                                >
                                  {s.time}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-6 text-xs text-stone">
                    Horários calculados para {formatDuration(totalDuration)} de atendimento, no fuso do salão.
                  </p>
                </StepShell>
              )}

              {step === 4 && (
                <StepShell title="Seus dados" hint="Usamos seus contatos apenas para confirmar e lembrar você do atendimento.">
                  <form
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      next();
                    }}
                    className="grid gap-5 sm:grid-cols-2"
                  >
                    <Field id="name" label="Nome completo *" error={errors.name} className="sm:col-span-2">
                      <input
                        id="name"
                        autoComplete="name"
                        className="field"
                        value={customer.name}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                        onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                        placeholder="Como devemos chamar você?"
                      />
                    </Field>
                    <Field id="phone" label="Telefone com DDD *" error={errors.phone}>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        className="field"
                        value={customer.phone}
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? "phone-error" : undefined}
                        onChange={(e) => setCustomer({ ...customer, phone: maskPhone(e.target.value) })}
                        placeholder="(11) 99999-9999"
                      />
                    </Field>
                    <Field id="whatsapp" label="WhatsApp *" error={sameWhatsapp ? undefined : errors.whatsapp}>
                      {sameWhatsapp ? (
                        <div className="field flex items-center text-stone">Mesmo número do telefone</div>
                      ) : (
                        <input
                          id="whatsapp"
                          type="tel"
                          inputMode="tel"
                          className="field"
                          value={customer.whatsapp}
                          aria-invalid={!!errors.whatsapp}
                          aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
                          onChange={(e) => setCustomer({ ...customer, whatsapp: maskPhone(e.target.value) })}
                          placeholder="(11) 99999-9999"
                        />
                      )}
                      <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-stone">
                        <input
                          type="checkbox"
                          checked={sameWhatsapp}
                          onChange={(e) => setSameWhatsapp(e.target.checked)}
                          className="h-4 w-4 accent-ink"
                        />
                        O WhatsApp é o mesmo número
                      </label>
                    </Field>
                    <Field id="email" label="E-mail (opcional)" error={errors.email} className="sm:col-span-2">
                      <input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        className="field"
                        value={customer.email}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        placeholder="voce@email.com"
                      />
                    </Field>
                    <Field id="notes" label="Observações (opcional)" error={errors.notes} className="sm:col-span-2">
                      <textarea
                        id="notes"
                        rows={4}
                        maxLength={1000}
                        className="field resize-y"
                        value={customer.notes}
                        onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                        placeholder="Referências, alergias, preferências..."
                      />
                    </Field>
                    {/* honeypot anti-spam: invisível para pessoas */}
                    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                      <label>
                        Website
                        <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
                      </label>
                    </div>
                    {/* permite avançar com Enter; o botão visível fica na navegação abaixo */}
                    <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
                      Avançar
                    </button>
                  </form>
                </StepShell>
              )}

              {step === 5 && slot && date && (
                <StepShell title="Revise e confirme" hint="Confira os detalhes antes de confirmar. A disponibilidade é verificada novamente no momento da confirmação.">
                  <div className="border border-line bg-white">
                    <dl className="divide-y divide-line">
                      {[
                        ["Cliente", customer.name.trim()],
                        ["Contato", `${customer.phone}${customer.email ? ` · ${customer.email}` : ""}`],
                        ["Serviço(s)", selected.map((s) => s.name).join(", ")],
                        ["Profissional", professional?.name ?? "Primeira disponibilidade"],
                        ["Data", formatDateLong(slot.startsAt, tz)],
                        ["Horário", slot.time],
                        ["Duração estimada", formatDuration(totalDuration)],
                        ["Valor total", `${anyFrom ? "a partir de " : ""}${formatPrice(totalPrice)}`],
                      ].map(([k, v]) => (
                        <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr] sm:px-8">
                          <dt className="label text-stone">{k}</dt>
                          <dd className="first-letter:uppercase">{v}</dd>
                        </div>
                      ))}
                      {customer.notes.trim() ? (
                        <div className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_1fr] sm:px-8">
                          <dt className="label text-stone">Observações</dt>
                          <dd className="whitespace-pre-line text-sm text-stone">{customer.notes.trim()}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                  {salon.cancellationPolicy ? (
                    <p className="mt-5 text-xs leading-relaxed text-stone">{salon.cancellationPolicy}</p>
                  ) : null}
                  {submitError ? <ErrorNote>{submitError}</ErrorNote> : null}
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={submitting}
                    className="btn btn-primary mt-8 w-full sm:w-auto"
                    aria-busy={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Confirmando
                      </>
                    ) : (
                      "Confirmar agendamento"
                    )}
                  </button>
                </StepShell>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navegação */}
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
          <button
            type="button"
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
            className="flex min-h-11 items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-stone transition-colors hover:text-ink disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Voltar
          </button>
          {step < 5 ? (
            <button type="button" onClick={next} disabled={!canContinue} className="btn btn-primary">
              Continuar <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Resumo */}
      <aside className="lg:col-span-4" aria-label="Resumo do agendamento">
        <div className="sticky top-28 bg-ink p-7 text-white sm:p-8">
          <p className="label text-accent">Seu agendamento</p>
          <ul className="mt-6 space-y-3 border-b border-white/10 pb-6">
            <AnimatePresence initial={false}>
              {selected.length === 0 ? (
                <motion.li key="empty" className="text-sm text-white/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Nenhum serviço selecionado
                </motion.li>
              ) : (
                selected.map((s) => (
                  <motion.li
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span>{s.name}</span>
                    <span className="text-white/70">{formatPrice(s.price_cents)}</span>
                  </motion.li>
                ))
              )}
            </AnimatePresence>
          </ul>
          <dl className="space-y-3 py-6 text-sm">
            <SummaryRow icon={<User className="h-3.5 w-3.5" />} label="Profissional" value={step >= 1 ? professional?.name ?? "Primeira disponibilidade" : "—"} />
            <SummaryRow icon={<Clock className="h-3.5 w-3.5" />} label="Duração" value={totalDuration ? formatDuration(totalDuration) : "—"} />
            <SummaryRow
              label="Data"
              value={date ? formatDateLong(`${date}T12:00:00Z`, "UTC").replace(/ de \d{4}$/, "") : "—"}
            />
            <SummaryRow label="Horário" value={slot?.time ?? "—"} />
          </dl>
          <div className="flex items-end justify-between border-t border-white/10 pt-6">
            <span className="label text-white/60">Total{anyFrom ? " (a partir de)" : ""}</span>
            <motion.span key={totalPrice} initial={{ opacity: 0.3, y: 4 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-3xl">
              {formatPrice(totalPrice)}
            </motion.span>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Progress({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <nav aria-label="Etapas do agendamento">
      <p className="label text-stone sm:hidden">
        Etapa {step + 1} de {STEPS.length}: <span className="text-ink">{STEPS[step]}</span>
      </p>
      <ol className="hidden grid-cols-6 gap-4 sm:grid">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => onJump(i)}
              disabled={i >= step}
              aria-current={i === step ? "step" : undefined}
              className="w-full text-left disabled:cursor-default"
            >
              <span className={`block text-[0.6rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 ${i <= step ? "text-ink" : "text-stone/60"}`}>
                <span className="block text-accent-deep">0{i + 1}</span>
                {label}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="relative mt-4 h-px bg-line">
        <motion.div
          className="absolute inset-y-0 left-0 bg-ink"
          initial={false}
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.4, ease: EASE }}
        />
      </div>
    </nav>
  );
}

function StepShell({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby="step-title">
      <h2 id="step-title" className="text-[clamp(2rem,4.4vw,3rem)] font-light leading-tight">
        {title}
      </h2>
      {hint ? <p className="mt-2 max-w-xl text-stone first-letter:uppercase">{hint}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function ChoiceCard({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative flex h-full w-full items-center gap-4 border p-3 pr-12 text-left transition-[border-color,box-shadow,transform] duration-200 ease-out active:scale-[0.985] ${
        active ? "border-ink bg-white shadow-[0_18px_40px_-28px_rgba(17,17,17,0.55)]" : "border-line bg-white hover:border-ink/40"
      }`}
    >
      {children}
      <span
        className={`absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border transition-[background-color,border-color,color] duration-200 ease-out ${
          active ? "border-ink bg-ink text-white" : "border-line text-transparent"
        }`}
        aria-hidden="true"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
    </button>
  );
}

function Field({
  id,
  label,
  error,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error ? (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs text-[#a4473b]"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2 text-white/50">
        {icon}
        {label}
      </dt>
      <dd className="text-right first-letter:uppercase">{value}</dd>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed border-line bg-white p-6 text-stone">{children}</p>;
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mb-6 mt-4 border-l-2 border-[#a4473b] bg-[#a4473b]/5 px-4 py-3 text-sm text-[#7d2f26]">
      {children}
    </p>
  );
}

function groupSlots(slots: SlotDTO[]) {
  const groups = [
    { label: "Manhã", slots: [] as SlotDTO[] },
    { label: "Tarde", slots: [] as SlotDTO[] },
    { label: "Noite", slots: [] as SlotDTO[] },
  ];
  for (const s of slots) {
    const h = Number(s.time.slice(0, 2));
    groups[h < 12 ? 0 : h < 18 ? 1 : 2].slots.push(s);
  }
  return groups.filter((g) => g.slots.length);
}
