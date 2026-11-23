-- =====================================================================
--  Plataforma de agendamento — schema principal
--  Execute no SQL Editor do Supabase (ou via `supabase db push`).
-- =====================================================================

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
do $$ begin
  create type public.appointment_status as enum
    ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_role as enum ('admin', 'staff', 'user');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Utilitário: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- profiles (1:1 com auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        public.user_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Cria o profile automaticamente quando um usuário é criado no Auth.
-- Todo novo usuário nasce SEM privilégios ('user'); a promoção a admin é
-- feita manualmente (ver docs/SUPABASE.md).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Verificação de permissão usada pelas políticas RLS.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- business_settings (linha única, id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.business_settings (
  id                     smallint primary key default 1 check (id = 1),
  name                   text not null default 'Atelier Aurea',
  tagline                text not null default 'Hair Atelier',
  logo_url               text,
  hero_image_url         text,
  about_image_url        text,
  description            text,
  address_street         text,
  address_number         text,
  address_complement     text,
  address_neighborhood   text,
  address_city           text,
  address_state          text,
  address_zip            text,
  latitude               double precision,
  longitude              double precision,
  phone                  text,
  whatsapp               text,           -- somente dígitos, com DDI: 5511999999999
  email                  text,
  instagram              text,           -- usuário sem @
  facebook               text,
  tiktok                 text,
  timezone               text not null default 'America/Sao_Paulo',
  slot_interval_minutes  integer not null default 15 check (slot_interval_minutes between 5 and 120),
  min_advance_minutes    integer not null default 60 check (min_advance_minutes >= 0),
  max_advance_days       integer not null default 60 check (max_advance_days between 1 and 365),
  auto_confirm           boolean not null default false,
  cancellation_policy    text,
  updated_at             timestamptz not null default now()
);

create trigger business_settings_touch before update on public.business_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 2 and 80),
  description       text,
  category          text,
  duration_minutes  integer not null check (duration_minutes between 5 and 600),
  price_cents       integer not null check (price_cents >= 0),
  price_from        boolean not null default false,   -- exibe "a partir de"
  image_url         text,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists services_active_sort_idx on public.services (is_active, sort_order);
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- professionals
-- ---------------------------------------------------------------------
create table if not exists public.professionals (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 2 and 80),
  specialty   text,
  bio         text,
  photo_url   text,
  instagram   text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists professionals_active_sort_idx on public.professionals (is_active, sort_order);
create trigger professionals_touch before update on public.professionals
  for each row execute function public.touch_updated_at();

-- Quais serviços cada profissional realiza
create table if not exists public.professional_services (
  professional_id  uuid not null references public.professionals (id) on delete cascade,
  service_id       uuid not null references public.services (id) on delete cascade,
  primary key (professional_id, service_id)
);
create index if not exists professional_services_service_idx on public.professional_services (service_id);

-- ---------------------------------------------------------------------
-- working_hours
--   professional_id NULL  => horário de funcionamento do salão
--   professional_id <id>  => jornada individual (se não houver linhas,
--                            o profissional segue o horário do salão)
--   Várias linhas no mesmo dia permitem intervalos (ex.: 09-12 e 13-19).
-- ---------------------------------------------------------------------
create table if not exists public.working_hours (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid references public.professionals (id) on delete cascade,
  weekday          smallint not null check (weekday between 0 and 6), -- 0 = domingo
  start_time       time not null,
  end_time         time not null,
  created_at       timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists working_hours_lookup_idx on public.working_hours (professional_id, weekday);

-- ---------------------------------------------------------------------
-- blocked_times (feriados, folgas, férias, manutenção...)
--   professional_id NULL => bloqueio do salão inteiro
-- ---------------------------------------------------------------------
create table if not exists public.blocked_times (
  id               uuid primary key default gen_random_uuid(),
  professional_id  uuid references public.professionals (id) on delete cascade,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  reason           text,
  created_at       timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists blocked_times_range_idx on public.blocked_times using gist (tstzrange(starts_at, ends_at, '[)'));
create index if not exists blocked_times_prof_idx on public.blocked_times (professional_id);

-- ---------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id                      uuid primary key default gen_random_uuid(),
  code                    text not null unique,
  professional_id         uuid not null references public.professionals (id) on delete restrict,
  customer_name           text not null check (char_length(customer_name) between 3 and 120),
  customer_phone          text not null check (customer_phone ~ '^[0-9]{10,13}$'),
  customer_whatsapp       text not null check (customer_whatsapp ~ '^[0-9]{10,13}$'),
  customer_email          text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notes                   text check (notes is null or char_length(notes) <= 1000),
  starts_at               timestamptz not null,
  ends_at                 timestamptz not null,
  total_duration_minutes  integer not null check (total_duration_minutes > 0),
  total_price_cents       integer not null check (total_price_cents >= 0),
  status                  public.appointment_status not null default 'pending',
  any_professional        boolean not null default false,
  cancelled_at            timestamptz,
  completed_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (ends_at > starts_at),
  -- GARANTIA DE NÃO-CONFLITO no nível do banco: o mesmo profissional
  -- nunca terá dois atendimentos ativos com horários sobrepostos, mesmo
  -- que duas requisições cheguem ao mesmo tempo.
  constraint appointments_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed', 'completed'))
);
create index if not exists appointments_starts_idx on public.appointments (starts_at);
create index if not exists appointments_prof_starts_idx on public.appointments (professional_id, starts_at);
create index if not exists appointments_status_idx on public.appointments (status);
create index if not exists appointments_phone_idx on public.appointments (customer_phone);
create trigger appointments_touch before update on public.appointments
  for each row execute function public.touch_updated_at();

-- Serviços de cada agendamento (com "foto" do preço/duração no momento)
create table if not exists public.appointment_services (
  appointment_id    uuid not null references public.appointments (id) on delete cascade,
  service_id        uuid references public.services (id) on delete set null,
  position          smallint not null default 0,
  service_name      text not null,
  price_cents       integer not null check (price_cents >= 0),
  duration_minutes  integer not null check (duration_minutes > 0),
  primary key (appointment_id, position)
);
create index if not exists appointment_services_service_idx on public.appointment_services (service_id);

-- Histórico de alterações de cada agendamento
create table if not exists public.appointment_events (
  id              bigint generated always as identity primary key,
  appointment_id  uuid not null references public.appointments (id) on delete cascade,
  action          text not null,
  from_status     public.appointment_status,
  to_status       public.appointment_status,
  details         jsonb,
  actor_id        uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists appointment_events_appt_idx on public.appointment_events (appointment_id, created_at);

-- ---------------------------------------------------------------------
-- reviews (somente avaliações reais cadastradas pelo administrador)
-- ---------------------------------------------------------------------
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  author_name   text not null check (char_length(author_name) between 2 and 80),
  photo_url     text,
  rating        smallint not null check (rating between 1 and 5),
  comment       text not null check (char_length(comment) between 5 and 1200),
  review_date   date not null default current_date,
  source        text,              -- ex.: "Google", "Presencial"
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists reviews_published_idx on public.reviews (is_published, review_date desc);

-- ---------------------------------------------------------------------
-- gallery_images
-- ---------------------------------------------------------------------
create table if not exists public.gallery_images (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  alt         text not null default '',
  category    text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists gallery_active_sort_idx on public.gallery_images (is_active, sort_order);
