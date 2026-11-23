-- =====================================================================
--  Regras de agendamento executadas NO BANCO
--  (a interface nunca é a fonte da verdade sobre disponibilidade)
-- =====================================================================

-- Código legível e único para o cliente (ex.: AU-7K3F9Q)
create or replace function public.generate_appointment_code()
returns text language plpgsql volatile as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  bytes bytea := gen_random_bytes(6);
  result text := 'AU-';
  i int;
begin
  for i in 0..5 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return result;
end $$;

-- ---------------------------------------------------------------------
-- Intervalos ocupados (sem nenhum dado pessoal) para cálculo de agenda
-- ---------------------------------------------------------------------
create or replace function public.get_busy_intervals(p_from timestamptz, p_to timestamptz)
returns table (professional_id uuid, starts_at timestamptz, ends_at timestamptz, kind text)
language sql stable security definer set search_path = public as $$
  select a.professional_id, a.starts_at, a.ends_at, 'appointment'::text
    from public.appointments a
   where a.status in ('pending', 'confirmed', 'completed')
     and a.starts_at < p_to and a.ends_at > p_from
  union all
  select b.professional_id, b.starts_at, b.ends_at, 'block'::text
    from public.blocked_times b
   where b.starts_at < p_to and b.ends_at > p_from;
$$;

-- ---------------------------------------------------------------------
-- Verifica se um profissional atende num intervalo (horário + bloqueios).
-- Não verifica conflitos com outros agendamentos: isso é garantido pela
-- constraint de exclusão `appointments_no_overlap` no momento do INSERT.
-- ---------------------------------------------------------------------
create or replace function public.professional_can_work(
  p_professional_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_timezone text
) returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_local_start timestamp := p_starts_at at time zone p_timezone;
  v_local_end   timestamp := p_ends_at   at time zone p_timezone;
  v_weekday     smallint  := extract(dow from v_local_start)::smallint;
  v_has_own     boolean;
begin
  if v_local_end::date <> v_local_start::date and v_local_end::time <> time '00:00' then
    return false;
  end if;

  select exists (select 1 from public.working_hours where professional_id = p_professional_id)
    into v_has_own;

  if v_has_own and not exists (
    select 1 from public.working_hours w
     where w.professional_id = p_professional_id
       and w.weekday = v_weekday
       and w.start_time <= v_local_start::time
       and w.end_time   >= v_local_end::time
  ) then
    return false;
  end if;

  if exists (
    select 1 from public.blocked_times b
     where b.professional_id = p_professional_id
       and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(p_starts_at, p_ends_at, '[)')
  ) then
    return false;
  end if;

  return true;
end $$;

-- ---------------------------------------------------------------------
-- book_appointment: valida TUDO de novo e grava de forma atômica.
-- Erros são lançados com mensagens-código tratadas pela API:
--   SETTINGS_MISSING, INVALID_SERVICES, TOO_SOON, TOO_FAR, INVALID_TIME,
--   OUTSIDE_HOURS, BLOCKED, PROFESSIONAL_UNAVAILABLE, SLOT_UNAVAILABLE
-- ---------------------------------------------------------------------
create or replace function public.book_appointment(
  p_service_ids        uuid[],
  p_professional_id    uuid,          -- NULL = primeira disponibilidade
  p_starts_at          timestamptz,
  p_customer_name      text,
  p_customer_phone     text,
  p_customer_whatsapp  text,
  p_customer_email     text default null,
  p_notes              text default null
)
returns table (
  appointment_id          uuid,
  code                    text,
  professional_id         uuid,
  professional_name       text,
  starts_at               timestamptz,
  ends_at                 timestamptz,
  total_duration_minutes  integer,
  total_price_cents       integer,
  status                  public.appointment_status
)
language plpgsql volatile security definer set search_path = public as $$
#variable_conflict use_column
declare
  s               public.business_settings;
  v_ids           uuid[];
  v_count         int;
  v_duration      int;
  v_price         int;
  v_ends_at       timestamptz;
  v_local_start   timestamp;
  v_local_end     timestamp;
  v_minute_of_day int;
  v_candidate     record;
  v_appt_id       uuid;
  v_code          text;
  v_status        public.appointment_status;
  v_attempt       int;
begin
  select * into s from public.business_settings where id = 1;
  if not found then
    raise exception 'SETTINGS_MISSING';
  end if;

  -- Serviços: remove duplicados mantendo a ordem escolhida
  select array_agg(id order by ord) into v_ids from (
    select id, min(ord) as ord
      from unnest(p_service_ids) with ordinality as t(id, ord)
     group by id
  ) d;

  if v_ids is null or array_length(v_ids, 1) is null or array_length(v_ids, 1) > 6 then
    raise exception 'INVALID_SERVICES';
  end if;

  select count(*), coalesce(sum(duration_minutes), 0), coalesce(sum(price_cents), 0)
    into v_count, v_duration, v_price
    from public.services
   where id = any (v_ids) and is_active;

  if v_count <> array_length(v_ids, 1) then
    raise exception 'INVALID_SERVICES';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => v_duration);

  -- Janela de antecedência
  if p_starts_at < now() + make_interval(mins => s.min_advance_minutes) then
    raise exception 'TOO_SOON';
  end if;
  if p_starts_at > now() + make_interval(days => s.max_advance_days) then
    raise exception 'TOO_FAR';
  end if;

  -- Horário alinhado à grade configurada
  v_local_start := p_starts_at at time zone s.timezone;
  v_local_end   := v_ends_at   at time zone s.timezone;
  v_minute_of_day := extract(hour from v_local_start)::int * 60 + extract(minute from v_local_start)::int;
  if extract(second from v_local_start) <> 0 or v_minute_of_day % s.slot_interval_minutes <> 0 then
    raise exception 'INVALID_TIME';
  end if;

  -- Funcionamento do salão
  if (v_local_end::date <> v_local_start::date and v_local_end::time <> time '00:00')
     or not exists (
       select 1 from public.working_hours w
        where w.professional_id is null
          and w.weekday = extract(dow from v_local_start)::smallint
          and w.start_time <= v_local_start::time
          and w.end_time   >= v_local_end::time
     ) then
    raise exception 'OUTSIDE_HOURS';
  end if;

  -- Feriados / bloqueios do salão inteiro
  if exists (
    select 1 from public.blocked_times b
     where b.professional_id is null
       and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(p_starts_at, v_ends_at, '[)')
  ) then
    raise exception 'BLOCKED';
  end if;

  v_status := case when s.auto_confirm then 'confirmed'::public.appointment_status
                   else 'pending'::public.appointment_status end;

  -- Candidatos: o profissional escolhido, ou todos os que realizam TODOS
  -- os serviços (ordenados pela menor carga no dia, para equilibrar a agenda).
  for v_candidate in
    select p.id, p.name
      from public.professionals p
     where p.is_active
       and (p_professional_id is null or p.id = p_professional_id)
       and (select count(*) from public.professional_services ps
             where ps.professional_id = p.id and ps.service_id = any (v_ids)) = array_length(v_ids, 1)
     order by (
       select count(*) from public.appointments a
        where a.professional_id = p.id
          and a.status in ('pending', 'confirmed')
          and (a.starts_at at time zone s.timezone)::date = v_local_start::date
     ), p.sort_order, p.name
  loop
    if not public.professional_can_work(v_candidate.id, p_starts_at, v_ends_at, s.timezone) then
      continue;
    end if;

    for v_attempt in 1..5 loop
      begin
        v_code := public.generate_appointment_code();
        insert into public.appointments as a (
          code, professional_id, customer_name, customer_phone, customer_whatsapp,
          customer_email, notes, starts_at, ends_at, total_duration_minutes,
          total_price_cents, status, any_professional
        ) values (
          v_code, v_candidate.id, btrim(p_customer_name), p_customer_phone, p_customer_whatsapp,
          nullif(btrim(coalesce(p_customer_email, '')), ''), nullif(btrim(coalesce(p_notes, '')), ''),
          p_starts_at, v_ends_at, v_duration, v_price, v_status, p_professional_id is null
        ) returning a.id into v_appt_id;
        exit;
      exception
        when exclusion_violation then
          -- Horário foi ocupado (inclusive por requisição simultânea)
          v_appt_id := null;
          exit;
        when unique_violation then
          -- Colisão rara de código: tenta outro
          v_appt_id := null;
      end;
    end loop;

    if v_appt_id is not null then
      insert into public.appointment_services (appointment_id, service_id, position, service_name, price_cents, duration_minutes)
      select v_appt_id, sv.id, (t.ord - 1)::smallint, sv.name, sv.price_cents, sv.duration_minutes
        from unnest(v_ids) with ordinality as t(id, ord)
        join public.services sv on sv.id = t.id;

      return query select v_appt_id, v_code, v_candidate.id, v_candidate.name,
                          p_starts_at, v_ends_at, v_duration, v_price, v_status;
      return;
    end if;
  end loop;

  if p_professional_id is not null and not exists (
    select 1 from public.professionals p where p.id = p_professional_id and p.is_active
  ) then
    raise exception 'PROFESSIONAL_UNAVAILABLE';
  end if;

  raise exception 'SLOT_UNAVAILABLE';
end $$;

-- ---------------------------------------------------------------------
-- Gatilhos de agendamento: datas de status, recalcular término ao
-- reagendar e registrar histórico automaticamente.
-- ---------------------------------------------------------------------
create or replace function public.appointments_before_update()
returns trigger language plpgsql as $$
begin
  if new.starts_at is distinct from old.starts_at and new.ends_at = old.ends_at then
    new.ends_at := new.starts_at + make_interval(mins => new.total_duration_minutes);
  end if;
  if new.status is distinct from old.status then
    if new.status = 'cancelled' then new.cancelled_at := now(); end if;
    if new.status = 'completed' then new.completed_at := now(); end if;
  end if;
  return new;
end $$;

drop trigger if exists appointments_before_update on public.appointments;
create trigger appointments_before_update before update on public.appointments
  for each row execute function public.appointments_before_update();

create or replace function public.appointments_log_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.appointment_events (appointment_id, action, to_status, actor_id)
    values (new.id, 'created', new.status, auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.appointment_events (appointment_id, action, from_status, to_status, actor_id)
    values (new.id, 'status_changed', old.status, new.status, auth.uid());
  end if;

  if new.starts_at is distinct from old.starts_at or new.professional_id is distinct from old.professional_id then
    insert into public.appointment_events (appointment_id, action, details, actor_id)
    values (new.id, 'rescheduled', jsonb_build_object(
      'from_starts_at', old.starts_at, 'to_starts_at', new.starts_at,
      'from_professional_id', old.professional_id, 'to_professional_id', new.professional_id
    ), auth.uid());
  end if;

  if new.notes is distinct from old.notes then
    insert into public.appointment_events (appointment_id, action, actor_id)
    values (new.id, 'notes_updated', auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists appointments_log_event on public.appointments;
create trigger appointments_log_event after insert or update on public.appointments
  for each row execute function public.appointments_log_event();

-- ---------------------------------------------------------------------
-- Permissões das funções: somente o servidor (service_role) agenda e
-- consulta ocupação; o navegador nunca chama essas funções diretamente.
-- ---------------------------------------------------------------------
revoke all on function public.book_appointment(uuid[], uuid, timestamptz, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.get_busy_intervals(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.professional_can_work(uuid, timestamptz, timestamptz, text) from public, anon, authenticated;
grant execute on function public.book_appointment(uuid[], uuid, timestamptz, text, text, text, text, text) to service_role;
grant execute on function public.get_busy_intervals(timestamptz, timestamptz) to service_role, authenticated;
grant execute on function public.professional_can_work(uuid, timestamptz, timestamptz, text) to service_role;
