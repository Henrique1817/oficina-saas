# Console da plataforma (apps/admin)

Painel separado do produto das oficinas. **Fase A** — fundação.

## URLs

| App | Local |
|-----|--------|
| Oficinas (`web`) | http://localhost:3000 |
| Console (`admin`) | http://localhost:3001 |

## Acesso

1. E-mail deve estar em `PLATFORM_ADMIN_EMAILS` no `.env` (ex.: `henrimi4710@gmail.com`)
2. Mesma conta Supabase do produto
3. Conta de oficina **sem** estar na lista → `/unauthorized`

## Subir

```bash
# Dev
pnpm --filter @oficina/admin dev

# Docker (web + admin)
docker compose up -d --build
```

## Estrutura

- Login: `/login`
- Overview: `/`
- Oficinas: `/oficinas`
- Pagamentos: `/pagamentos`
- Saúde: `/saude`
- Suporte: `/suporte`
- Audit: `/audit`
- Equipe: `/equipe`

## Env relevantes

No projeto Vercel do **admin** (root `apps/admin`), configure:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
PLATFORM_ADMIN_EMAILS=henrimi4710@gmail.com
NEXT_PUBLIC_APP_URL=https://SEU-APP-WEB.vercel.app
NEXT_PUBLIC_ADMIN_URL=https://SEU-ADMIN.vercel.app
```

Sem Supabase + `DATABASE_URL`, o console cai com *“Application error: a server-side exception…”*.

Build monorepo: use [`apps/admin/vercel.json`](../apps/admin/vercel.json) (install/build a partir da raiz).

No Supabase Auth → URL Configuration, inclua o domínio do admin nas Redirect URLs.

```
PLATFORM_ADMIN_EMAILS=seu@email.com
# opcional: restringe IPs do console
# PLATFORM_ADMIN_IPS=127.0.0.1,::1
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
# mesmo Supabase/DB do web
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
DIRECT_URL=
# opcional: links Mercado Pago test vs live no console
MERCADOPAGO_ACCESS_TOKEN=
# Nunca expoe SERVICE_ROLE no browser — só server/middleware
SUPABASE_SERVICE_ROLE_KEY=
```

## Fase B — Oficinas

- Lista `/oficinas` com busca (nome/slug), filtro de status e “só suspensas”
- Detalhe `/oficinas/[id]`: plano, links Mercado Pago, membros, audit log
- Ações: suspender / reativar, estender trial (+7/+14), nota interna
- Impersonar: token one-time → `web` `/api/v1/platform/impersonate` (banner “modo suporte”)

Suspensão usa `organizations.suspended_at` (bloqueia o produto independente do Mercado Pago).

## Fase C — Pagamentos

- Dashboard `/pagamentos`: MRR (ACTIVE × R$ 97), contagens por status, churn 30d
- Alertas: fila PAST_DUE + trials acabando em &lt; 3 dias
- Lista de orgs com `mpPreapprovalId` + links painel Mercado Pago
- Cortesia: `organizations.billing_exempt` — sem dunning; acesso liberado (exceto se suspensa)
- Legacy bootstrap já marca cortesia

## Fase D — Equipe (RBAC)

- Model `platform_users` + roles: OWNER · SUPPORT · FINANCE · VIEWER
- UI `/equipe`: convidar, mudar role, desativar (só OWNER)
- Permissões:
  - OWNER: tudo
  - SUPPORT: tenants + impersonate (sem cortesia)
  - FINANCE: cortesia / cobrança write
  - VIEWER: só leitura (ações destrutivas ocultas)
- Bootstrap: `PLATFORM_ADMIN_EMAILS` → OWNER no 1º login; seed inicial `henrimi4710@gmail.com`
- Acesso ao console = `platform_users.active` (allowlist só fallback se ainda sem linha)

## Fase E — Saúde / dashboards

- Overview: meta 15–20 ACTIVE com barra de progresso + resumo autonomia
- `/saude`: signups/semana, conversão trial→pago, OS 7d/30d, orgs com uso, top tenants
- Scorecard autonomia (CRON_SECRET, Resend, Mercado Pago, crons &lt;48h, meta ACTIVE)
- `platform_cron_runs`: último run de low-stock / trial-ending / dunning
- Soft-launch agregado (% tenants com checklist mínimo)
- Export 1-click: `GET /api/export/metrics` → CSV (substitui ritual manual de `ops/metrics.csv`)

## Fase F — Suporte, audit e endurecimento

- `/suporte`: busca por e-mail, nome, slug ou ID Mercado Pago → oficinas/pessoas
- Detalhe da oficina: **timeline** (signup, trial, PAST_DUE, suspensão, audit)
- `/audit`: log global filtrável (suspend, impersonate, trial, cortesia, equipe)
- Rate limit por IP no middleware; allowlist opcional `PLATFORM_ADMIN_IPS`
- Cookie de auth separado: `oficina-admin-auth` (não compartilha sessão com o web)
- CSP + headers de segurança no `next.config` / middleware
- Tenant autenticado mas fora de `platform_users` → `/unauthorized`
- MFA (2FA) recomendado no login e em `/equipe`
