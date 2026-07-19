# Deploy com Docker

A app sobe em **qualquer VPS / cloud** com Docker. Auth e Postgres continuam no **Supabase** (e Stripe/Resend externos).

## Pré-requisitos

- Docker + Docker Compose v2
- Arquivo `.env` na raiz (copie de `.env.example`)

Variáveis `NEXT_PUBLIC_*` são embutidas **no build** — se mudar URL pública ou keys do Supabase, rebuild:

```bash
docker compose up -d --build
```

## Subir

```bash
# Na raiz do repo
cp .env.example .env   # se ainda não tiver
# edite .env com valores reais

docker compose up -d --build
```

App em http://localhost:3000 (ou `PORT` no `.env`).

## Comandos úteis

| Comando | Efeito |
|---------|--------|
| `docker compose up -d --build` | Build + sobe |
| `docker compose logs -f web` | Logs |
| `docker compose down` | Para |
| `docker compose restart web` | Reinicia |

## Migrations

Por padrão o container roda `prisma migrate deploy` no boot (`RUN_MIGRATIONS=true`).

Só migrar (sem ficar com o servidor rodando neste comando):

```bash
docker compose run --rm --entrypoint prisma web \
  migrate deploy --schema=/app/packages/database/prisma/schema.prisma
```

Ou desligue no `.env`:

```
RUN_MIGRATIONS=false
```

## Crons (estoque, trial, dunning)

No Vercel os crons vêm do `vercel.json`. Em Docker, agende no host ou no provedor:

```bash
# Ex.: crontab no VPS (ajuste o domínio e o secret)
0 8 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SEU_DOMINIO/api/v1/cron/low-stock
0 9 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SEU_DOMINIO/api/v1/cron/trial-ending
0 10 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://SEU_DOMINIO/api/v1/cron/dunning
```

## Proxy / HTTPS

Coloque Nginx, Caddy ou Traefik na frente apontando para `localhost:3000`.  
Defina `NEXT_PUBLIC_APP_URL=https://seu-dominio.com` e faça **rebuild**.

## Só a imagem (sem Compose)

```bash
docker build -t oficina-web \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  --build-arg NEXT_PUBLIC_APP_URL=https://seu-dominio.com \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=... \
  .

docker run -d --name oficina-web -p 3000:3000 --env-file .env oficina-web
```

## Troubleshooting

- **Build falha em `NEXT_PUBLIC_*`**: preencha no `.env` antes do `compose build`.
- **502 / Prisma**: confira `DATABASE_URL` e `DIRECT_URL` (pooler Supabase).
- **Assets 404**: confirme que `apps/web/public` existe na imagem e que o rebuild incluiu `.next/static`.
