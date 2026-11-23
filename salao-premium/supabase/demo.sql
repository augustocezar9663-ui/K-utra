-- =====================================================================
--  OPCIONAL — dados de DEMONSTRAÇÃO para testar o fluxo de agendamento
--  antes de cadastrar a equipe real. Os nomes são marcados como
--  "(exemplo)". Remova-os em /admin/profissionais antes de publicar.
-- =====================================================================

insert into public.professionals (slug, name, specialty, bio, sort_order) values
  ('profissional-exemplo-1', 'Profissional 1 (exemplo)', 'Corte & Visagismo', 'Perfil de demonstração. Substitua pela apresentação real do profissional.', 1),
  ('profissional-exemplo-2', 'Profissional 2 (exemplo)', 'Colorimetria',      'Perfil de demonstração. Substitua pela apresentação real do profissional.', 2)
on conflict (slug) do nothing;

-- Ambos realizam todos os serviços ativos
insert into public.professional_services (professional_id, service_id)
select p.id, s.id
  from public.professionals p cross join public.services s
 where p.slug like 'profissional-exemplo-%'
on conflict do nothing;
