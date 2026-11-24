# Atelier Aurea — Plataforma de agendamento para salão

Site institucional premium + agendamento online + painel administrativo para salão de corte masculino.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Motion · Lucide · Supabase (Postgres, Auth, Storage) · Zod.

> O nome "Atelier Aurea", os preços e as durações são **valores iniciais editáveis** no painel.
> Nenhum depoimento, profissional ou número de clientes é inventado: essas seções só exibem o que o administrador cadastrar.

---

## Funcionalidades

**Site público**
- Header transparente sobre o hero que vira barra de vidro fosco ao rolar; menu mobile em tela cheia.
- Hero cinematográfico com revelação dos títulos linha a linha e parallax suave.
- Serviços em cards (imagem, descrição, duração, preço, "a partir de", botão de agendar).
- Sobre, Galeria editorial com filtro por categoria e lightbox (teclado: ← → Esc), Profissionais, Depoimentos (só aparece com avaliações reais publicadas), Localização (mapa, "Como chegar", horários).
- Botão flutuante de WhatsApp (dúvidas / solicitar confirmação), com aviso de que a mensagem só é enviada quando o cliente tocar em enviar.
- SEO: metadata, Open Graph com imagem gerada, `sitemap.xml`, `robots.txt`, JSON-LD `HairSalon`, página 404 e página de erro.
- Acessibilidade: `prefers-reduced-motion` respeitado em todas as animações, foco visível, link "pular para o conteúdo", labels/aria nos formulários, alvos de toque ≥ 44px.

**Agendamento (`/agendar`)** — 6 etapas
1. Serviços (múltipla escolha; só permite combinar serviços que algum profissional realize juntos)
2. Profissional ou "primeira disponibilidade"
3. Calendário (dias passados bloqueados; dias com horário livre destacados; feriados/bloqueios respeitados)
4. Horários em tempo real, considerando a duração somada dos serviços
5. Dados do cliente (validação com Zod no cliente **e** no servidor; anti-spam honeypot)
6. Revisão → confirmação → tela de sucesso com código único (`AU-XXXXXX`), WhatsApp com mensagem pronta, `.ics` e Google Agenda, e e-mail (se o Resend estiver configurado)

**Garantia contra conflitos:** a confirmação chama a função `book_appointment` no Postgres, que revalida tudo (serviços ativos, antecedência, grade, funcionamento do salão, jornada do profissional, bloqueios) e grava sob uma **constraint de exclusão** (`appointments_no_overlap`). Duas reservas simultâneas para o mesmo profissional/horário: só uma é gravada — testado com 12 conexões concorrentes.

**Painel (`/admin`)** — protegido por login + papel `admin` (proxy + verificação no servidor + RLS no banco)
- Dashboard: total, agendamentos do dia, pendentes, faturamento registrado (atendimentos concluídos), gráfico por dia, faturamento por mês, serviços mais procurados, próximos atendimentos.
- Agendamentos: filtros (hoje / próximos / histórico / data / status), busca por nome, telefone ou código, confirmar, concluir, não compareceu, cancelar, reativar, reagendar (com bloqueio de conflito), WhatsApp para o cliente e histórico completo (auditoria automática por trigger).
- Serviços, Profissionais (foto, especialidade, serviços realizados, jornada individual), Bloqueios e feriados, Galeria, Avaliações e Configurações (dados do salão, logo, fotos, endereço, contatos, redes, horários de funcionamento, dias de atendimento, grade, antecedência, confirmação automática, política de cancelamento).

---

## Instalação

Requisitos: Node.js 20+ e um projeto no [Supabase](https://supabase.com) (plano gratuito serve).

```bash
cd salao-premium
npm install
cp .env.example .env.local   # preencha as variáveis (ver abaixo)
npm run dev                  # http://localhost:3000
```

Configure o banco seguindo **[docs/SUPABASE.md](docs/SUPABASE.md)** (≈10 minutos).

### Variáveis de ambiente

| Variável | Onde obter | Exposta ao navegador? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL final do site | sim |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → `anon`/publishable key | sim (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → `service_role`/secret key | **não — somente servidor** |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` | [resend.com](https://resend.com) (opcional) | não |

Sem o Resend o site funciona normalmente e **não** diz que enviou e-mail.

### Scripts

```bash
npm run dev     # desenvolvimento
npm run build   # build de produção (TypeScript incluso)
npm run start   # servir o build
npm run lint    # ESLint
```

### Deploy (Vercel)

1. Importe o repositório na Vercel e defina **Root Directory = `salao-premium`**.
2. Cadastre as variáveis de ambiente acima (Production e Preview).
3. Deploy. Depois, em Supabase → Authentication → URL Configuration, informe a URL do site.

---

## Arquitetura

```
salao-premium/
├── supabase/
│   ├── migrations/0001_schema.sql    tabelas, índices, FKs, constraint anti-conflito
│   ├── migrations/0002_booking.sql   book_appointment, ocupação, triggers de histórico
│   ├── migrations/0003_rls.sql       Row Level Security
│   ├── migrations/0004_storage.sql   bucket "media" + políticas
│   ├── seed.sql                      configurações e serviços iniciais
│   └── demo.sql                      (opcional) 2 profissionais de exemplo
└── src/
    ├── proxy.ts                      renova sessão e protege /admin
    ├── app/(site)/                   home e /agendar
    ├── app/admin/                    login, painel e Server Actions
    ├── app/api/availability          dias/horários livres (sem dados pessoais)
    ├── app/api/appointments          criação do agendamento (validação + RPC)
    ├── components/{site,booking,admin,ui}
    └── lib/                          disponibilidade, fuso horário, validação, Supabase, e-mail, SEO
```

**Segurança**
- A chave `service_role` só é importada em arquivos `server-only` (`lib/supabase/admin.ts`).
- Visitantes (anon) leem apenas conteúdo ativo/publicado. Agendamentos, bloqueios e histórico (dados de clientes) são legíveis **somente** por admins (RLS).
- O navegador nunca grava no banco diretamente: o agendamento passa pela API, que valida com Zod, aplica rate limit e chama `book_appointment` (permissão de execução só para `service_role`).
- Todas as Server Actions do painel chamam `assertAdmin()`; as páginas chamam `requireAdmin()`; o banco aplica RLS de novo.
- Cabeçalhos de segurança (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`), `/admin` com `noindex`.

**Cache**
- Conteúdo público (configurações, serviços, equipe, horários, galeria, avaliações) usa `"use cache"` com tags. Salvar no painel invalida na hora; alterações feitas direto no banco aparecem em até 10 minutos.
- Disponibilidade e agendamento nunca são cacheados.

**Fuso horário:** toda a agenda é calculada no fuso configurado do salão (padrão `America/Sao_Paulo`), independentemente do fuso do cliente ou do servidor.

### Fotografias

O projeto **não inclui fotos de banco de imagens apresentadas como se fossem do salão**. As 4 fotos de cortes enviadas pelo salão ficam em `public/galeria/` e são cadastradas pelo `seed.sql` na *Galeria* (degradê, cacheado e mullet); a do mullet também ilustra o serviço *Corte Masculino* e a do degradê na nuca, o *Acabamento*. Onde ainda não há foto, o site exibe composições gráficas abstratas na paleta da marca.

- Para trocar, ocultar ou remover uma foto: `/admin/galeria` (ou *Serviços*). Rodar o seed de novo não recria fotos removidas.
- Novas fotos podem ser enviadas pelo painel (vão para o Storage do Supabase). Fotos feitas no celular, na vertical, funcionam bem: a galeria foi desenhada para retratos.
- Publique apenas fotos de clientes que autorizaram o uso da imagem — no caso de menores de idade, com autorização do responsável (LGPD).

### Rate limit

O limite de tentativas (agendamento: 8 a cada 10 min por IP; login: 10 a cada 15 min) é em memória, por instância. Em ambientes com várias instâncias, troque `src/lib/rate-limit.ts` por um armazenamento compartilhado (ex.: Upstash Redis).
