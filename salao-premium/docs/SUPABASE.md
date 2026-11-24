# Configurando o Supabase

## 1. Criar o projeto

1. Acesse [supabase.com](https://supabase.com) → **New project**.
2. Escolha a região **South America (São Paulo)** para menor latência.
3. Guarde a senha do banco.

## 2. Criar as tabelas, funções e regras de segurança

No painel do projeto, abra **SQL Editor** → **New query** e execute, **nesta ordem**, o conteúdo de cada arquivo:

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_booking.sql`
3. `supabase/migrations/0003_rls.sql`
4. `supabase/migrations/0004_storage.sql`
5. `supabase/seed.sql` — configurações iniciais, horário de funcionamento (ter–sáb, 09h–19h) e o catálogo de corte masculino (9 serviços com preços de exemplo: corte, corte + barba, barba, acabamento, coloração, platinado, pigmentação, hidratação e sobrancelha). Se você já tinha rodado uma versão antiga, rodar de novo desativa os exemplos femininos antigos sem tocar no que foi personalizado
6. *(opcional)* `supabase/demo.sql` — 2 profissionais marcados como "(exemplo)" para testar o agendamento. **Remova-os** em `/admin/profissionais` antes de publicar.

> Alternativa com a CLI: `supabase link --project-ref <ref>` e `supabase db push` (aplica as migrations); depois rode `seed.sql` no SQL Editor.

## 3. Copiar as chaves para o `.env.local`

**Project Settings → API**

| Campo no Supabase | Variável |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / secret key | `SUPABASE_SERVICE_ROLE_KEY` |

⚠️ A `service_role` ignora todas as regras de segurança. Nunca a coloque em variável com prefixo `NEXT_PUBLIC_`, em código do navegador ou em repositório.

## 4. Criar o usuário administrador

1. **Authentication → Users → Add user → Create new user**: informe e-mail e senha forte, marque *Auto Confirm User*.
2. No **SQL Editor**, promova-o a administrador:

```sql
update public.profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'seu-email@dominio.com');
```

3. Recomendado: **Authentication → Sign In / Providers → Email** → desative *Allow new users to sign up*. Assim ninguém cria conta sozinho (e, mesmo que criasse, nasceria sem permissão: papel `user`).

Acesse `/admin/login` com esse e-mail e senha.

## 5. Primeiros passos no painel

1. **Configurações** → nome, logo, fotos, endereço, telefone, WhatsApp (com DDD, ex.: `11999999999`), Instagram, horários de funcionamento, intervalo da grade, antecedência mínima e política de cancelamento.
2. **Serviços** → ajuste preços, durações e descrições.
3. **Profissionais** → cadastre a equipe, marque os serviços que cada um realiza e, se necessário, a jornada individual.
4. **Bloqueios e feriados** → cadastre feriados, folgas e férias.
5. **Galeria** e **Avaliações** → conteúdo real do salão.

Sem pelo menos um profissional ativo vinculado aos serviços, o agendamento online mostra que não há horários disponíveis.

## Como funciona a proteção contra horários duplicados

- `GET /api/availability` calcula horários livres a partir do funcionamento, da jornada de cada profissional, dos bloqueios e dos atendimentos ativos (a função `get_busy_intervals` devolve apenas intervalos de tempo — nenhum dado de cliente).
- `POST /api/appointments` valida os dados e chama `book_appointment`, que **refaz todas as verificações no banco** e insere o atendimento.
- A constraint `appointments_no_overlap` (`EXCLUDE USING gist`) impede, no nível do Postgres, que o mesmo profissional tenha dois atendimentos ativos sobrepostos — inclusive em requisições simultâneas. Quem perde a corrida recebe "Este horário acabou de ser reservado" e volta para a escolha de horário.
- Reagendamentos feitos no painel passam pela mesma constraint.

## E-mail de confirmação (opcional)

1. Crie uma conta no [Resend](https://resend.com), verifique seu domínio e gere uma API key.
2. Preencha `RESEND_API_KEY`, `EMAIL_FROM` (ex.: `Atelier Aurea <agenda@seusalao.com.br>`) e, se quiser receber cópia de cada agendamento, `ADMIN_NOTIFICATION_EMAIL`.
3. O cliente recebe e-mail apenas se informar o endereço; a tela de sucesso só diz "enviamos para o seu e-mail" quando o Resend aceitou o envio.

## Backup e privacidade

- Ative backups em **Database → Backups** (planos pagos) ou exporte periodicamente.
- Os dados de clientes (nome, telefone, e-mail, observações) ficam apenas na tabela `appointments`, acessível somente por administradores. Inclua no site sua política de privacidade conforme a LGPD.
