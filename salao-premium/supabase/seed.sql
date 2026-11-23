-- =====================================================================
--  Dados iniciais (configuração). Preços e durações são valores
--  INICIAIS DE EXEMPLO — edite-os no painel em /admin/servicos.
--  Nenhum depoimento, profissional ou número de clientes é criado aqui.
-- =====================================================================

insert into public.business_settings (id, name, tagline, description, cancellation_policy)
values (
  1,
  'Atelier Aurea',
  'Hair Atelier',
  'Cada detalhe importa. Nosso propósito é proporcionar uma experiência única, unindo técnica, cuidado e sofisticação para valorizar a beleza e a personalidade de cada cliente.',
  'Cancelamentos e reagendamentos podem ser solicitados com até 24 horas de antecedência pelo WhatsApp. Atrasos superiores a 15 minutos podem exigir reagendamento.'
)
on conflict (id) do nothing;

-- Horário de funcionamento do salão (professional_id NULL).
-- Exemplo: terça a sábado, 09:00–19:00. Ajuste em /admin/configuracoes.
insert into public.working_hours (professional_id, weekday, start_time, end_time)
select null, d, time '09:00', time '19:00'
  from generate_series(2, 6) as d
 where not exists (select 1 from public.working_hours where professional_id is null);

insert into public.services (slug, name, description, category, duration_minutes, price_cents, price_from, sort_order) values
  ('corte-feminino',        'Corte Feminino',         'Consultoria de visagismo e corte personalizado, desenhado para o seu formato de rosto, textura e rotina.', 'Corte',       60, 18000, false, 1),
  ('corte-masculino',       'Corte Masculino',        'Corte preciso com acabamento na tesoura ou máquina, finalizado com produtos de alta performance.',           'Corte',       45, 11000, false, 2),
  ('escova',                'Escova',                 'Escova modeladora com proteção térmica para um acabamento polido, com movimento e brilho duradouros.',      'Finalização', 45,  9000, true,  3),
  ('coloracao',             'Coloração',              'Cor sob medida com diagnóstico do fio, pigmentos de alta fixação e cuidado com a integridade capilar.',       'Cor',        120, 32000, true,  4),
  ('mechas',                'Mechas',                 'Mechas, balayage ou morena iluminada com técnicas de iluminação natural e tonalização personalizada.',      'Cor',        180, 55000, true,  5),
  ('hidratacao',            'Hidratação',             'Ritual de hidratação profunda que devolve maciez, elasticidade e brilho aos fios.',                         'Tratamento',  60, 15000, false, 6),
  ('reconstrucao-capilar',  'Reconstrução Capilar',   'Reposição de massa e proteínas para fios fragilizados por química, calor ou agressões do dia a dia.',      'Tratamento',  75, 22000, false, 7),
  ('tratamento-especializado','Tratamento Especializado','Protocolo desenvolvido após análise do couro cabeludo e da fibra capilar, para necessidades específicas.', 'Tratamento',  90, 28000, true,  8),
  ('penteados',             'Penteados',              'Penteados para eventos, noivas e ocasiões especiais, com prova e acabamento impecável.',                    'Finalização', 90, 26000, true,  9)
on conflict (slug) do nothing;
