# Fase 0 — Ações manuais (fora do código)

Checklist para fechar a fundação SaaS. Marque ao concluir.

## Segurança (obrigatório — secrets já vazaram no .env.example antigo)

- [ ] Supabase Dashboard → Project Settings → API → **Rotate** `service_role` (e, se possível, `anon`)
- [ ] Atualizar `.env` local com as novas chaves (não commitar)
- [ ] Gerar novo `CRON_SECRET` (`openssl rand -hex 32` ou equivalente) e atualizar `.env`
- [ ] Confirmar que `.env.example` e `apps/web/.env.local.example` só têm placeholders
- [ ] Se as chaves antigas estiveram em git/histórico público, considerar o projeto comprometido até rotacionar

## Stripe

Conta MCP conectada: **Barbearia-SaaS** (`acct_1Tu0SsQyNtoAJlmk`).

Produtos criados em **live mode** (produção):

| Item | ID |
|------|-----|
| Product `Oficina` | `prod_UtoBr78SZ4jhHB` |
| Mensal R$ 97 | `price_1Tu0Z8QyNtoAJlmkDBwGZxIN` → `STRIPE_PRICE_MONTHLY` |
| Anual R$ 970 | `price_1Tu0Z7QyNtoAJlmksl3PgHlb` → `STRIPE_PRICE_YEARLY` |

- [x] Product + Prices criados via MCP
- [x] Política de trial no código: **14 dias** + **cartão obrigatório no cadastro** + cobrança automática (`createTrialCheckoutSession`)
- [x] Metadata do Product Stripe: `trial_days=14`, `card_required_at_signup=true`
- [ ] Colar Price IDs e keys no `.env` local / Vercel
- [ ] Copiar Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Secret / Restricted Key → `STRIPE_SECRET_KEY` (**live** se for usar esses prices; `sk_test_` só serve se criar prices equivalentes em Test)
- [ ] Customer Portal: ativar cancelamento / troca de método de pagamento
- [ ] Webhook na Fase 2 (`/api/v1/billing/webhook`) → `STRIPE_WEBHOOK_SECRET`
- [ ] (Recomendado) No Dashboard, modo **Test**, duplicar Product/Prices para desenvolvimento local

### Política de cobrança (fixada)

1. Ao finalizar o cadastro da oficina → Checkout Stripe (`mode: subscription`).
2. Cliente **cadastra o cartão** (`payment_method_collection: always`).
3. Assinatura entra em **trial de 14 dias** (R$ 0 nesse período).
4. No dia 15 o Stripe **cobra automaticamente** o plano (mensal ou anual).
5. Se não houver cartão válido no fim do trial → assinatura **cancela**.

## Vercel + domínio

- [ ] Inicializar git no monorepo e publicar no GitHub (privado)
- [ ] New Project na Vercel → Root Directory = `apps/web`
- [ ] Conferir Install/Build (já em `apps/web/vercel.json`)
- [ ] Variáveis de ambiente: checklist completo em [`ops/vercel-env.md`](./vercel-env.md) (Production + Preview)
- [ ] `NEXT_PUBLIC_APP_URL` = URL de produção (ex.: `https://app.seudominio.com`)
- [ ] Apontar domínio customizado quando tiver
- [ ] Rodar `pnpm --filter @oficina/database db:migrate:deploy` apontando para o banco de prod (ou via CI)

## Jurídico / marca

- [ ] Definir nome comercial definitivo (hoje: **Oficina**)
- [ ] Preencher placeholders em `/termos` e `/privacidade` (razão social, CNPJ/CPF, e-mail, foro)
- [ ] Abrir/usar CNPJ se for cobrar como pessoa jurídica
- [ ] Revisar textos com contador/advogado antes de cobrar clientes reais (recomendado)

## Métricas

- [ ] Usar `ops/metrics.csv` toda semana (MRR, trials, conversão, churn)
- [ ] Meta Fase 0: planilha viva; dashboard interno só depois do billing (Fase 2+)
