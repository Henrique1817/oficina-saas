# Pipeline de produção (apps/web)

Fluxo: **PR → CI** · **push `main` → migrate + Vercel + smoke** · logs em **admin → Pipelines**.

## Secrets

### Vercel (`apps/web` — Production)

Espelhar [`.env.example`](../.env.example). Mínimo para o app subir:

| Variável | Obrigatória |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim |
| `SUPABASE_SERVICE_ROLE_KEY` | sim |
| `DATABASE_URL` | sim (pooler) |
| `DIRECT_URL` | sim |
| `NEXT_PUBLIC_APP_URL` | sim (URL do deploy, sem `/`) |
| `CRON_SECRET` | sim |
| `PIPELINE_INGEST_SECRET` | sim (Bearer dos workflows) |
| Stripe / Resend / WhatsApp | conforme billing e e-mail |

`NEXT_PUBLIC_*` entram no **build** — após mudar, faça redeploy.

### GitHub Actions (repo → Settings → Secrets and variables → Actions)

| Secret | Uso |
|--------|-----|
| `DATABASE_URL` | `prisma migrate deploy` (prod) |
| `DIRECT_URL` | migrate (conexão direta) |
| `VERCEL_TOKEN` | Deploy CLI |
| `VERCEL_ORG_ID` | `vercel link` / deploy |
| `VERCEL_PROJECT_ID` | projeto web |
| `PIPELINE_INGEST_SECRET` | igual ao Vercel |
| `PIPELINE_INGEST_URL` | Base URL de prod, ex. `https://app.seudominio.com` (sem `/`) |

Opcional no CI de PR: se `PIPELINE_INGEST_URL` + secret existirem, o CI também reporta steps; senão pula o report.

## Workflows

| Arquivo | Quando | O que faz |
|---------|--------|-----------|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | PR / push | lint, typecheck, unit, api contracts |
| [`.github/workflows/cd-web.yml`](../.github/workflows/cd-web.yml) | push `main` | migrate → Vercel → smoke health |

## Smoke

```bash
node scripts/api-smoke.mjs https://SEU_DOMINIO
```

Exige `GET /api/v1/health` com HTTP 200 e `status: "ok"`, e `GET /login` < 500.

## Painel

Console admin → **Pipelines** (`/pipelines`): lista de runs e timeline de steps.

Retenção: cron `pipeline-retention` apaga runs com mais de 90 dias.

## Troubleshooting

| Sintoma | Ação |
|---------|------|
| CI verde, CD falha no migrate | Conferir `DATABASE_URL`/`DIRECT_URL` e rede GitHub → Supabase |
| Deploy ok, smoke 503 | App sem `DATABASE_URL` no Vercel ou migrate não rodou |
| Painel vazio | `PIPELINE_INGEST_*` no Actions + secret no Vercel; path `/api/v1/platform/pipeline/*` |
| Login quebra pós-deploy | Supabase Auth → Site URL / Redirect URLs = domínio Vercel |
