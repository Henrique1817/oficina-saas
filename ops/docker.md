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
Console em http://localhost:3001 (`ADMIN_PORT`).  
Marketing em http://localhost:3004 (`MARKETING_PORT`; container interno :3002).

## Comandos úteis

| Comando | Efeito |
|---------|--------|
| `docker compose up -d --build` | Build + sobe todos |
| `docker compose up -d --build marketing` | Só o site marketing |
| `docker compose logs -f web` | Logs do produto |
| `docker compose logs -f marketing` | Logs do marketing |
| `docker compose down` | Para |
| `docker compose restart web` | Reinicia |

## Marketing (`apps/marketing`)

Site de conversão. Variáveis embutidas no **build**:

- `NEXT_PUBLIC_APP_URL` — CTAs signup/login do produto
- `NEXT_PUBLIC_SITE_URL` — URL pública do site (SEO/OG); local Docker: `http://localhost:3004`
- `NEXT_PUBLIC_WHATSAPP` — opcional (DDI + número)

```bash
docker compose up -d --build marketing
# → http://localhost:3004
```

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
