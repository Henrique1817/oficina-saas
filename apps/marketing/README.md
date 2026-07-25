# @oficina/marketing

Site marketing de conversão do **Oficina** — landing cinematográfica apontando CTAs para o app SaaS (`apps/web`).

## Rodar

Na raiz do monorepo:

```bash
pnpm install
cp apps/marketing/.env.example apps/marketing/.env.local
# edite NEXT_PUBLIC_APP_URL (produto) e NEXT_PUBLIC_SITE_URL (este site)
pnpm dev:marketing
```

Abre em [http://localhost:3002](http://localhost:3002).

## Variáveis

| Var | Uso |
|-----|-----|
| `NEXT_PUBLIC_APP_URL` | Base do produto (ex. `https://app.seudominio.com`). CTAs → `{URL}/signup` e `/login` |
| `NEXT_PUBLIC_SITE_URL` | URL pública deste site (SEO, sitemap, Open Graph) |
| `NEXT_PUBLIC_WHATSAPP` | Só dígitos com DDI (ex. `5511…`) — atalho WhatsApp em contato/footer |
| `DATABASE_URL` | Postgres Supabase (pooler) — **obrigatória** para `/api/contact` gravar leads |
| `DIRECT_URL` | Postgres direto — necessária no `prisma generate` / migrations |

## Contato → Supabase

`POST /api/contact` valida o formulário e grava em `contact_leads`. A equipe vê em **Console → Contatos** (`apps/admin`).

Rode a migration no banco de produção:

```bash
pnpm --filter @oficina/database db:migrate:deploy
```

## Rotas

`/` · `/precos` · `/funcionalidades` · `/ajuda` · `/contato` · `/termos` · `/privacidade`

## Build

```bash
pnpm --filter @oficina/marketing build
```

## Deploy (Vercel)

Root directory: `apps/marketing`. Install/Build em `vercel.json`. Defina as variáveis da tabela acima (incluindo `DATABASE_URL` e `DIRECT_URL`).

## Docker

Na raiz do monorepo:

```bash
docker compose up -d --build marketing
```

Site em [http://localhost:3004](http://localhost:3004) (host; container interno :3002). Detalhes em [`ops/docker.md`](../../ops/docker.md).
