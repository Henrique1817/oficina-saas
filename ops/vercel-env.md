# Vercel — variáveis do `apps/web`

## Projeto

| Setting | Valor |
|--------|--------|
| Root Directory | `apps/web` |
| Framework | Next.js (detectado) |
| Install / Build | já em `apps/web/vercel.json` (`pnpm install` + `db:generate` + build) |
| Node | **20.x** ou **22.x** (Settings → Node.js Version) |

Sem Root Directory = `apps/web`, o monorepo não monta e o deploy falha.

Marque **Production** e **Preview** (e Development se usar `vercel dev`) para cada variável abaixo. Depois de alterar `NEXT_PUBLIC_*`, faça **Redeploy**.

---

## Obrigatórias (build + runtime)

| Variável | Onde pegar | Notas |
|----------|------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Embutida no build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | mesma tela (anon / publishable) | Embutida no build |
| `SUPABASE_SERVICE_ROLE_KEY` | mesma tela (service_role) | **Só server**; nunca expor no client |
| `DATABASE_URL` | Supabase → Database → Connection string → **Pooler** (porta **6543**) + `?pgbouncer=true` | Necessária no `prisma generate` do build |
| `DIRECT_URL` | Pooler ou direct, porta **5432** (migrations) | Necessária no `prisma generate` do build |
| `NEXT_PUBLIC_APP_URL` | URL pública do app (ex. `https://app.seudominio.com`) | Sem barra final |
| `CRON_SECRET` | `openssl rand -hex 32` | Bearer dos crons em `vercel.json` |

Sem `DATABASE_URL` / `DIRECT_URL` o passo `pnpm db:generate` no build da Vercel costuma falhar com *Environment variable not found*.

---

## Billing (fortemente recomendadas)

| Variável | Notas |
|----------|--------|
| `MERCADOPAGO_ACCESS_TOKEN` | Produção ou `TEST-…` |
| `MERCADOPAGO_WEBHOOK_SECRET` | Webhook → `POST /api/webhooks/mercadopago` |
| `MERCADOPAGO_USE_SANDBOX` | `false` em produção |
| `PLATFORM_ADMIN_EMAILS` | E-mails com acesso a growth/impersonate (vírgula) |

---

## Convites (e-mail mágico)

| Variável | Notas |
|----------|--------|
| `RESEND_API_KEY` | HTML personalizado com magic link do Supabase |
| `RESEND_FROM_EMAIL` | Remetente verificado (ex. `Oficina <onboarding@resend.dev>`) |

No Supabase Auth → Redirect URLs: `{NEXT_PUBLIC_APP_URL}/auth/callback**`

---

## Opcionais

| Variável | Uso |
|----------|-----|
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Convites e e-mails transacionais |
| `NEXT_PUBLIC_WHATSAPP` | Só dígitos com DDI (atalho suporte) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | mailto no tenant |
| `NEXT_PUBLIC_ADMIN_URL` | Console plataforma (impersonação / links) |
| `PIPELINE_INGEST_SECRET` | Se usar ingest de pipeline CI |

Referência completa de placeholders: `.env.example` na raiz.

---

## Erros comuns neste monorepo

1. **Prisma `rhel-openssl-3.0.x` / engine not found** — o schema precisa de `binaryTargets` com `rhel-openssl-3.0.x` e o app usa `@prisma/nextjs-monorepo-workaround-plugin` (já no código).
2. **Env faltando no build** — `DATABASE_URL` + `DIRECT_URL` + Supabase `NEXT_PUBLIC_*` no projeto Vercel do web.
3. **Root Directory errado** — deve ser `apps/web`, não a raiz do repo.
4. **Preview sem envs** — copie as mesmas chaves para o ambiente Preview (ou use “All Environments”).
