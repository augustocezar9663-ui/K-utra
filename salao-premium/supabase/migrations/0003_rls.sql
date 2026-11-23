-- =====================================================================
--  Row Level Security
--  - Visitantes (anon) leem apenas conteúdo público e ativo.
--  - Dados de clientes (appointments*) são visíveis SOMENTE para admins.
--  - Escrita em qualquer tabela: somente admins.
--  - O agendamento público passa pela função book_appointment, chamada
--    exclusivamente pelo servidor com a service_role.
-- =====================================================================

alter table public.profiles              enable row level security;
alter table public.business_settings     enable row level security;
alter table public.services              enable row level security;
alter table public.professionals         enable row level security;
alter table public.professional_services enable row level security;
alter table public.working_hours         enable row level security;
alter table public.blocked_times         enable row level security;
alter table public.appointments          enable row level security;
alter table public.appointment_services  enable row level security;
alter table public.appointment_events    enable row level security;
alter table public.reviews               enable row level security;
alter table public.gallery_images        enable row level security;

-- profiles ------------------------------------------------------------
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: admin update" on public.profiles;
create policy "profiles: admin update" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- business_settings -----------------------------------------------------
drop policy if exists "settings: public read" on public.business_settings;
create policy "settings: public read" on public.business_settings
  for select to anon, authenticated using (true);

drop policy if exists "settings: admin write" on public.business_settings;
create policy "settings: admin write" on public.business_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- services ------------------------------------------------------------
drop policy if exists "services: public read active" on public.services;
create policy "services: public read active" on public.services
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists "services: admin write" on public.services;
create policy "services: admin write" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- professionals -------------------------------------------------------
drop policy if exists "professionals: public read active" on public.professionals;
create policy "professionals: public read active" on public.professionals
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists "professionals: admin write" on public.professionals;
create policy "professionals: admin write" on public.professionals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- professional_services -----------------------------------------------
drop policy if exists "professional_services: public read" on public.professional_services;
create policy "professional_services: public read" on public.professional_services
  for select to anon, authenticated using (true);

drop policy if exists "professional_services: admin write" on public.professional_services;
create policy "professional_services: admin write" on public.professional_services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- working_hours -------------------------------------------------------
drop policy if exists "working_hours: public read" on public.working_hours;
create policy "working_hours: public read" on public.working_hours
  for select to anon, authenticated using (true);

drop policy if exists "working_hours: admin write" on public.working_hours;
create policy "working_hours: admin write" on public.working_hours
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- blocked_times (somente admin; a ocupação pública vem de get_busy_intervals)
drop policy if exists "blocked_times: admin all" on public.blocked_times;
create policy "blocked_times: admin all" on public.blocked_times
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- appointments + relacionados: dados pessoais => somente admin --------
drop policy if exists "appointments: admin all" on public.appointments;
create policy "appointments: admin all" on public.appointments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "appointment_services: admin all" on public.appointment_services;
create policy "appointment_services: admin all" on public.appointment_services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "appointment_events: admin read" on public.appointment_events;
create policy "appointment_events: admin read" on public.appointment_events
  for select to authenticated using (public.is_admin());

-- reviews -------------------------------------------------------------
drop policy if exists "reviews: public read published" on public.reviews;
create policy "reviews: public read published" on public.reviews
  for select to anon, authenticated using (is_published or public.is_admin());

drop policy if exists "reviews: admin write" on public.reviews;
create policy "reviews: admin write" on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- gallery_images ------------------------------------------------------
drop policy if exists "gallery: public read active" on public.gallery_images;
create policy "gallery: public read active" on public.gallery_images
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists "gallery: admin write" on public.gallery_images;
create policy "gallery: admin write" on public.gallery_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Visitantes não podem escrever em lugar nenhum, nem com RLS desligado por engano
revoke insert, update, delete on all tables in schema public from anon;
