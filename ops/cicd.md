# CI/CD — Oficina monorepo

Fluxo: **PR → CI** (lint · typecheck · tests · build) · **push `main` → CD** (migrate · deploy Vercel · smoke).

## Apps

| App | Path | Vercel Root Directory | CD secret do projeto |
|-----|------|----------------------|---------------------|
| Produto | `apps/web` | `apps/web` | `VERCEL_PROJECT_ID_WEB` (ou legado `VERCEL_PROJECT_ID`) |
| Console | `apps/admin` | `apps/admin` | `VERCEL_PROJECT_ID_ADMIN` (opcional — skip se ausente) |
| Marketing | `apps/marketing` | `apps/marketing` | `VERCEL_PROJECT_ID_MARKETING` (opcional — skip se ausente) |

## Workflows

| Arquivo | Quando | O que faz |
|---------|--------|-----------|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | PR / push `main` | `pnpm lint` · `typecheck` · `test` · `build` |
| [`.github/workflows/cd.yml`](../.github/workflows/cd.yml) | push `main` / manual | migrate prod → deploy web (+ admin/marketing se secrets) → smoke |

## Secrets (GitHub → Settings → Secrets and variables → Actions)

| Secret | Uso |
|--------|-----|
| `DATABASE_URL` | `prisma migrate deploy` |
| `DIRECT_URL` | migrate (conexão direta) |
| `VERCEL_TOKEN` | Deploy CLI |
| `VERCEL_ORG_ID` | Org Vercel |
| `VERCEL_PROJECT_ID_WEB` | Projeto do produto |
| `VERCEL_PROJECT_ID_ADMIN` | Projeto do console (opcional) |
| `VERCEL_PROJECT_ID_MARKETING` | Projeto do site (opcional) |
| `PIPELINE_INGEST_URL` | Base URL do web em prod (report opcional) |
| `PIPELINE_INGEST_SECRET` | Bearer do report (opcional; skip se ausente) |

## Variáveis Vercel

Espelhar [`.env.example`](../.env.example) / [`ops/vercel-env.md`](./vercel-env.md) em cada projeto. `NEXT_PUBLIC_*` entram no **build**.

### Convites (magic link)

No projeto **web**:

| Var | Uso |
|-----|-----|
| `RESEND_API_KEY` | Envia HTML personalizado com o magic link do Supabase |
| `RESEND_FROM_EMAIL` | Remetente verificado no Resend |
| `SUPABASE_SERVICE_ROLE_KEY` | Gera invite/magic link (`auth.admin.generateLink`) |
| `NEXT_PUBLIC_APP_URL` | Base do redirect `/auth/callback?next=/invite/...` |

No **Supabase → Authentication → URL Configuration → Redirect URLs**, inclua:

```
https://SEU-APP.vercel.app/auth/callback
https://SEU-APP.vercel.app/auth/callback/**
```

Sem Resend, o app tenta `inviteUserByEmail` (SMTP do Supabase). Personalize o template **Invite user** no painel Auth se quiser.

## Testes locais

```bash
pnpm install
pnpm test          # @oficina/auth + @oficina/shared (vitest)
pnpm typecheck     # packages + web + admin + marketing
pnpm lint
pnpm build
```

Smoke:

```bash
pnpm api:smoke -- https://SEU_APP.vercel.app
pnpm site:smoke -- https://SEU_ADMIN.vercel.app /login
pnpm site:smoke -- https://SEU_SITE.vercel.app / /contato
```

## Gate de merge

CI precisa ficar verde (incluindo `pnpm build` das três apps) antes de mergear na `main`. O CD sobe produção automaticamente após o push.
