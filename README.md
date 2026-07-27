# Oficina

**A oficina no controle — OS, estoque e orçamento sem planilha.**

SaaS multi-tenant para oficinas mecânicas brasileiras. Cada oficina tem seu ambiente isolado: clientes, veículos, peças, ferramentas e ordens de serviço em um só lugar — com assinatura Mercado Pago, trial de 14 dias e um console interno para a equipe da plataforma operar, sustentar e crescer.

| | |
|---|---|
| **Para quem** | Oficinas pequenas e médias que ainda vivem de planilha, WhatsApp e caderno |
| **Modelo** | SaaS B2B — **R$ 97/mês** ou **R$ 970/ano** |
| **Trial** | 14 dias grátis (cartão no cadastro; cobrança só após o trial) |
| **Apps** | Produto (`apps/web`) · console (`apps/admin`) · marketing (`apps/marketing`) |

---

## Por que vender a Oficina

1. **Resolve o dia a dia da oficina** — não é só CRM: fecha o ciclo cadastro → orçamento → OS → estoque → ferramenta.
2. **Produto SaaS de verdade** — multi-tenant, billing, dunning, invites, onboarding e gate de assinatura (páginas + API).
3. **Operação escalável** — console de plataforma com suporte, auditoria, impersonação, MRR e saúde do negócio.
4. **Stack moderna e deployável** — Next.js 15, Supabase, Prisma, Mercado Pago, Docker / Vercel.
5. **Pronto para soft launch** — fluxo de signup, trial, checklist go-live e automações (estoque baixo, fim de trial, cobrança).

---

## O que o cliente (oficina) ganha

### Dashboard operacional
Visão rápida de OS abertas, estoque baixo, ferramentas em uso e clientes — com atalhos para as ações do dia.

### Clientes e veículos
Cadastro de clientes com veículos (placa, modelo, ano, problema relatado). Variantes de veículo e *fitment* de peças no modelo de dados, para o catálogo “servir” no carro certo.

### Ordens de serviço (OS)
Máquina de estados completa: rascunho → aprovada → em execução → concluída → faturada / cancelada. Linhas de peça e serviço, mão de obra, mecânico responsável e histórico de status.

### Orçamento que vende
Orçamento por OS com envio/aprovação/rejeição, visualização para impressão/PDF e atalho para WhatsApp — o que o mecânico e o dono já usam para fechar serviço.

### Estoque de peças
Catálogo, locais de estoque, movimentos (entrada, saída, ajuste, consumo na OS) e alerta de estoque baixo (cron + e-mail).

### Controle de ferramentas
Patrimônio da oficina: retirada, devolução e manutenção — menos “ferramenta sumiu”.

### Equipe e convites
Papéis **Admin**, **Gerente** e **Mecânico**. O admin convida a equipe por link (e-mail opcional via Resend). Mecânico opera com restrições sensatas (ex.: OS atribuída).

### Assinatura e self-serve
Checkout Mercado Pago, gestão em `/billing` (cancelar assinatura), status de plano (trial / ativo / inadimplente / cancelado). Sem plano válido (após grace de 3 dias em `PAST_DUE`), o app e a API param — o dono vai para `/billing` e regulariza.

### Onboarding e go-live
Criação da oficina, setup guiado e checklist de prontidão (dados, Mercado Pago, primeira OS faturada) para a oficina começar a usar de verdade.

### Ajuda e landing
Landing comercial, FAQ de preços/trial (`/ajuda`), login/signup e páginas legais (`/termos`, `/privacidade`).

---

## O que a equipe da plataforma ganha (`apps/admin`)

Console separado (porta **3001** em local) para quem vende e sustenta o produto — não misturado com a UI da oficina.

| Módulo | Facilidade |
|--------|------------|
| **Overview** | Panorama operacional da base |
| **Oficinas** | Busca, detalhe, suspensão/reativação, extensão de trial, nota interna, link Mercado Pago |
| **Impersonação** | Entrar na conta do tenant (token único + banner + auditoria) para suporte real |
| **Pagamentos** | MRR estimado, filas PAST_DUE, trials acabando, **cortesia** (`billingExempt`) |
| **Saúde** | Signups, conversão trial→pago, volume de OS, status dos crons; export CSV de métricas |
| **Suporte** | Lookup por e-mail, nome, slug ou ID Mercado Pago + timeline da oficina |
| **Auditoria** | Log global de ações sensíveis (suspender, impersonar, trial, cortesia, equipe) |
| **Equipe** | RBAC interno: **Owner**, **Support**, **Finance**, **Viewer** |

Hardening do console: cookie de sessão próprio, rate limit, CSP, allowlist de e-mails e (opcional) IPs.

---

## Como funciona o negócio (GTM embutido)

```text
Signup → Trial 14 dias → Uso no workshop → Cobrança automática
                ↓ inadimplência
         Soft access 3 dias + e-mails de dunning
                ↓
         Bloqueio → /billing (checkout / portal)
```

- **Crons** (protegidos por `CRON_SECRET`): estoque baixo, trial acabando, dunning.
- **Webhook Mercado Pago** (`/api/webhooks/mercadopago`): sincroniza assinatura e status do plano.
- **E-mails** (Resend, opcional): convite, fim de trial, falha de pagamento, estoque baixo.
- **Métricas**: scorecard no admin + export CSV; histórico manual em `ops/metrics.csv`.

Documentação de go-to-market e operação: pasta [`ops/`](ops/).

---

## Tecnologias

| Camada | Escolha |
|--------|---------|
| Apps | **Next.js 15** (App Router), **React 19**, **Tailwind CSS 4**, GSAP |
| Monorepo | **Turborepo** + **pnpm** (Node 20+) |
| Banco | **PostgreSQL** (Supabase) + **Prisma** |
| Auth | **Supabase Auth** (sessão cookie + Bearer na API) |
| Cobrança | **Mercado Pago** (PreApproval, `/billing`, webhooks) |
| E-mail | **Resend** (opcional) |
| Deploy | **Vercel** (produto) e/ou **Docker Compose** (web + admin) |
| Validação | **Zod** (`@oficina/shared`) |
| API | Route Handlers REST em `/api/v1/*` + `withAuth` |

### Pacotes do monorepo

| Pacote | Função |
|--------|--------|
| `apps/web` | Produto SaaS da oficina (UI + API) |
| `apps/admin` | Console da plataforma |
| `apps/marketing` | Site marketing de conversão (landing) |
| `packages/database` | Schema Prisma, migrações, seed, client |
| `packages/auth` | `withAuth`, RBAC de rotas, contexto de org |
| `packages/shared` | Schemas Zod, helpers HTTP, política de acesso ao plano |

---

## Multi-tenant e segurança (diferenciais para venda B2B)

- Isolamento por **organização** (`organizationId` em todos os dados de negócio).
- Membership por usuário (um e-mail pode, no modelo, pertencer a uma oficina com papel definido).
- Gate de assinatura nas **páginas** e nas **APIs** (HTTP **402** se não houver acesso) — checkout/portal e `/me` liberados para regularizar.
- Suspensão manual pelo console (corta acesso mesmo com plano).
- Cortesia comercial sem quebrar o modelo de billing.
- Impersonação auditada para suporte sem pedir senha do cliente.
- Roles claros no tenant e no console da plataforma.

---

## Mapa rápido das áreas do produto

| Área | Quem usa | O que faz |
|------|----------|-----------|
| `/workshop` | Todos | Dashboard, OS, ferramentas |
| `/manager` | Todos* | Clientes, peças / estoque |
| `/admin` (tenant) | Admin da oficina | Usuários, go-live, growth (operador) |
| `/billing` | Admin | Assinatura Mercado Pago |
| `/onboarding` | Novo tenant | Criar e configurar a oficina |
| `admin` app | Equipe Oficina | Operar a plataforma |

\* Com políticas de API por papel (mecânico com limites onde aplicável).

---

## API REST (para integrações e o próprio front)

Autenticação: `Authorization: Bearer <access_token>` (Supabase).

Principais módulos: `me`, `customers`, `vehicles`, `vehicle-variants`, `parts`, `inventory`, `tools`, `service-orders` (+ transition, lines, labor, quote), `users`, `invites`, `dashboard/stats`, `billing` (checkout, portal, webhook), `cron/*`, `health`.

Validação Zod em toda entrada sensível; erros padronizados (`apiSuccess` / `apiError`).

---

## Pré-requisitos e subida local

- Node.js **20+**
- pnpm **9+**
- Projeto [Supabase](https://supabase.com) (Postgres + Auth)
- Conta [Mercado Pago](https://www.mercadopago.com.br/developers) (produção/teste)
- (Opcional) [Resend](https://resend.com) para e-mails

```bash
cp .env.example .env   # preencha Supabase, Mercado Pago, CRON_SECRET, URLs
pnpm install
pnpm db:generate
pnpm --filter @oficina/database db:migrate:deploy
pnpm db:seed
pnpm dev               # web :3000 — ou pnpm dev:web / pnpm dev:admin
```

### Mercado Pago (assinaturas)

| Variável | Uso |
|----------|-----|
| `MERCADOPAGO_ACCESS_TOKEN` | Credencial **Produção** (`APP_USR-…`) ou teste (`TEST-…`) — copiar da aba certa |
| `MERCADOPAGO_WEBHOOK_SECRET` | Assinatura secreta do webhook (obrigatório em produção) |
| `MERCADOPAGO_USE_SANDBOX` | `false` em produção (só `init_point`); `true` só em teste (`sandbox_init_point`) |
| `NEXT_PUBLIC_APP_URL` | URL pública sem barra final |

Webhook no painel MP: `{NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`

Planos resolvidos no servidor: **R$ 97/mês** · **R$ 970/ano** · trial **14 dias**. Cartão só no Mercado Pago — nada de cartão no nosso servidor.

**Armadilhas:** (1) token `APP_USR-` existe em teste e produção; (2) app com `sandbox_mode` no painel MP quebra cobrança real; (3) nunca misturar `sandbox_init_point` com token de produção; (4) **vendedor não pode pagar a própria assinatura** com a mesma conta MP — teste com outra conta em janela anônima; (5) após mudar env na Vercel, faça **redeploy**.

Detalhes: [`ops/fase-2-billing.md`](ops/fase-2-billing.md).

Docker: ver [`ops/docker.md`](ops/docker.md) (`web` + `admin`).

---

## Deploy (visão de venda / operação)

- **CI/CD**: [`ops/cicd.md`](ops/cicd.md) — GitHub Actions (lint · typecheck · tests · build · migrate · Vercel · smoke).
- **Produto (`apps/web`)**: Vercel com root directory `apps/web` — ver `apps/web/vercel.json` (build + crons).
- **Variáveis Vercel**: checklist em [`ops/vercel-env.md`](ops/vercel-env.md) (Supabase, Prisma, Stripe, crons).
- **Console (`apps/admin`)**: deploy separado (Vercel com root `apps/admin` ou Docker na `:3001`).
- Após os dois estarem no ar, cruzar `NEXT_PUBLIC_APP_URL` (e URLs do admin) para impersonação e links.
- Variáveis: espelhar `.env.example` (nunca commitar segredos).

Checklists de fundação, billing e soft launch: [`ops/fase-0-acoes-manuais.md`](ops/fase-0-acoes-manuais.md) … [`ops/fase-6-autonomia.md`](ops/fase-6-autonomia.md).

---

## Papéis (resumo comercial)

**Na oficina**

| Papel | Poder |
|-------|--------|
| Admin | Tudo: usuários, billing, operação |
| Gerente | Operação completa (cadastros, OS, estoque, ferramentas) |
| Mecânico | Operação no chão; restrições em OS onde fizer sentido |

**Na plataforma**

| Papel | Poder |
|-------|--------|
| Owner | Console completo + equipe |
| Support | Oficinas, suporte, impersonação |
| Finance | Pagamentos / cortesia |
| Viewer | Somente leitura |

---

## Roadmap / fora do escopo atual (transparência que fecha venda séria)

Hoje o produto **não** inclui (de propósito, nesta fase): NF-e, multi-filial, app mobile nativo nem white-label. Ideal para **soft launch** e primeiras oficinas pagantes; expansão natural depois de product-market fit.

---

## Documentação operacional

| Doc | Conteúdo |
|-----|----------|
| [`ops/pipeline-producao.md`](ops/pipeline-producao.md) | CI/CD GitHub Actions + logs no admin |
| [`ops/console-plataforma.md`](ops/console-plataforma.md) | Console admin |
| [`ops/fase-2-billing.md`](ops/fase-2-billing.md) | Mercado Pago, trial, gates |
| [`ops/docker.md`](ops/docker.md) | Compose web + admin |
| [`ops/support-templates.md`](ops/support-templates.md) | Templates de suporte |
| [`ops/whatsapp-scripts.md`](ops/whatsapp-scripts.md) | Scripts de aquisição |

---

## Licença e contato

Produto proprietário — **Oficina**. Para demonstração, parceria ou comercialização, use o fluxo de signup do app ou os canais documentados em `ops/`.

> **Tagline para pitch:** *SaaS completo para oficinas mecânicas: OS, estoque, ferramentas e cobrança — com console para você operar a plataforma.*
