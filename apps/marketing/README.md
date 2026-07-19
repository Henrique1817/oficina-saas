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

## Rotas

`/` · `/precos` · `/funcionalidades` · `/ajuda` · `/contato` · `/termos` · `/privacidade`

## Build

```bash
pnpm --filter @oficina/marketing build
```

## Deploy (Vercel)

Root directory: `apps/marketing`. Defina as três variáveis de ambiente acima no projeto.

## Docker

Na raiz do monorepo:

```bash
docker compose up -d --build marketing
```

Site em [http://localhost:3004](http://localhost:3004) (host; container interno :3002). Detalhes em [`ops/docker.md`](../../ops/docker.md).
