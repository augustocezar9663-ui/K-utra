-- =====================================================================
--  Dados iniciais (configuração). Preços e durações são valores
--  INICIAIS DE EXEMPLO — edite-os no painel em /admin/servicos.
--  Site PESSOAL: cria um único profissional (o dono do site), por isso o
--  agendamento não mostra a etapa "Profissional". Nenhum depoimento ou
--  número de clientes é criado aqui.
-- =====================================================================

-- "Seu Nome" é um marcador: troque pelo seu nome em /admin/configuracoes.
-- Telefone e WhatsApp: (69) 9608-1567 (somente dígitos, com DDD).
insert into public.business_settings (id, name, tagline, description, cancellation_policy, phone, whatsapp)
values (
  1,
  'Seu Nome',
  'Corte masculino',
  'Cada detalhe importa. Meu propósito é proporcionar uma experiência única, unindo técnica, cuidado e sofisticação para valorizar a beleza e a personalidade de cada cliente.',
  'Cancelamentos e reagendamentos podem ser solicitados com até 24 horas de antecedência pelo WhatsApp. Atrasos superiores a 15 minutos podem exigir reagendamento.',
  '6996081567',
  '6996081567'
)
on conflict (id) do update
  -- se as configurações já existirem, só preenche telefone/WhatsApp vazios
  set phone    = coalesce(public.business_settings.phone, excluded.phone),
      whatsapp = coalesce(public.business_settings.whatsapp, excluded.whatsapp);

-- Horário de funcionamento do salão (professional_id NULL).
-- Exemplo: terça a sábado, 09:00–19:00. Ajuste em /admin/configuracoes.
insert into public.working_hours (professional_id, weekday, start_time, end_time)
select null, d, time '09:00', time '19:00'
  from generate_series(2, 6) as d
 where not exists (select 1 from public.working_hours where professional_id is null);

-- Catálogo de CORTE MASCULINO (valores iniciais de exemplo — edite em /admin/servicos)
insert into public.services (slug, name, description, category, duration_minutes, price_cents, price_from, sort_order) values
  ('corte-masculino',     'Corte Masculino',     'Corte sob medida com consultoria de visagismo, na tesoura, máquina ou navalha, com lavagem e finalização.',     'Corte',      45, 11000, false, 1),
  ('corte-e-barba',       'Corte + Barba',       'O ritual completo: corte personalizado e barba desenhada na navalha, com toalha quente e acabamento com balm.',  'Corte',      75, 17000, false, 2),
  ('barba',               'Barba',               'Design e aparo da barba com navalha, toalha quente e hidratação, para um contorno preciso e confortável.',      'Barba',      40,  7000, false, 3),
  ('acabamento',          'Acabamento',          'Manutenção do contorno, da nuca e das laterais entre um corte e outro, para manter o visual alinhado.',          'Corte',      20,  4000, false, 4),
  ('coloracao-masculina', 'Coloração Masculina', 'Cobertura de fios brancos ou mudança de tom com resultado natural, no cabelo ou na barba.',                    'Cor',        60, 15000, true,  5),
  ('platinado',           'Platinado',           'Descoloração global com tonalização e cuidado com a integridade dos fios, para um platinado uniforme.',         'Cor',       150, 32000, true,  6),
  ('pigmentacao',         'Pigmentação',         'Preenchimento de falhas na barba ou no desenho do corte, para um acabamento mais definido e natural.',          'Barba',      30,  6000, false, 7),
  ('hidratacao',          'Hidratação',          'Tratamento que devolve maciez, brilho e controle aos fios, com massagem relaxante no couro cabeludo.',          'Tratamento', 40,  9000, false, 8),
  ('sobrancelha',         'Sobrancelha',         'Limpeza e alinhamento discreto da sobrancelha na navalha, com acabamento natural.',                            'Corte',      15,  3500, false, 9)
on conflict (slug) do nothing;

-- Instalações que já rodaram o seed antigo (catálogo feminino de exemplo):
-- desativa somente os exemplos que continuam com o nome original — nada
-- que tenha sido renomeado ou criado no painel é alterado.
update public.services
   set is_active = false
 where (slug, name) in (
   ('corte-feminino', 'Corte Feminino'), ('escova', 'Escova'), ('mechas', 'Mechas'),
   ('penteados', 'Penteados'), ('coloracao', 'Coloração'),
   ('reconstrucao-capilar', 'Reconstrução Capilar'), ('tratamento-especializado', 'Tratamento Especializado')
 );

-- Galeria: fotos de cortes enviadas pelo salão (arquivos em public/galeria).
-- Idempotente: cada foto só é inserida se ainda não estiver cadastrada, então
-- rodar o seed de novo não duplica nem reativa fotos removidas no painel.
insert into public.gallery_images (image_url, alt, category, sort_order)
select v.image_url, v.alt, v.category, v.sort_order
  from (values
    ('/galeria/degrade-baixo-nuca.jpg',        'Degradê baixo na lateral e na nuca, com o topo mais longo penteado para a frente', 'Degradê',  1),
    ('/galeria/degrade-medio-texturizado.jpg', 'Degradê médio na lateral com o topo texturizado',                                   'Degradê',  2),
    ('/galeria/cacheado-com-degrade.jpg',      'Cachos preservados no topo com degradê baixo nas laterais',                         'Cacheado', 3),
    ('/galeria/mullet-burst-fade.jpg',         'Mullet moderno com burst fade ao redor da orelha',                                  'Mullet',   4)
  ) as v(image_url, alt, category, sort_order)
 where not exists (select 1 from public.gallery_images g where g.image_url = v.image_url);

-- O dono do site: um único profissional que realiza todos os serviços.
-- Só é criado se ainda não houver nenhum profissional. Com um profissional
-- só, o agendamento pula a etapa "Profissional" e mostra ao cliente o nome
-- cadastrado em Configurações. Rode o seed de novo depois de criar serviços
-- para vinculá-los (ou marque-os em /admin/profissionais).
insert into public.professionals (slug, name, sort_order)
select 'agenda-principal', 'Agenda principal', 1
 where not exists (select 1 from public.professionals);

insert into public.professional_services (professional_id, service_id)
select p.id, s.id
  from public.professionals p cross join public.services s
 where p.slug = 'agenda-principal' and s.is_active
on conflict do nothing;
