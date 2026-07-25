# Fase 0 — Ações manuais (fora do código)

Checklist para fechar a fundação SaaS. Marque ao concluir.

## Segurança (obrigatório — secrets já vazaram no .env.example antigo)

- [ ] Supabase Dashboard → Project Settings → API → **Rotate** `service_role` (e, se possível, `anon`)
- [ ] Atualizar `.env` local com as novas chaves (não commitar)
- [ ] Gerar novo `CRON_SECRET` (`openssl rand -hex 32` ou equivalente) e atualizar `.env`
- [ ] Confirmar que `.env.example` e `apps/web/.env.local.example` só têm placeholders
- [ ] Se as chaves antigas estiveram em git/histórico público, considerar o projeto comprometido até rotacionar

## Mercado Pago

Ver [`ops/fase-2-billing.md`](fase-2-billing.md) para fluxo completo.

Planos no código: **mensal R$ 97** / **anual R$ 970** · trial **14 dias** · cartão no cadastro.

| Env | Uso |
|-----|-----|
| `MERCADOPAGO_ACCESS_TOKEN` | Token de produção (`APP_USR-…`) ou teste (`TEST-…`) |
| `MERCADOPAGO_WEBHOOK_SECRET` | Assinatura HMAC do webhook (obrigatório em produção) |
| `MERCADOPAGO_USE_SANDBOX` | `false` em produção |

- [x] Política de trial no código: **14 dias** + **cartão obrigatório no cadastro** + cobrança automática (PreApproval MP)
- [ ] Colar credenciais no `.env` local / Vercel
- [ ] Copiar Access Token → `MERCADOPAGO_ACCESS_TOKEN` (aba **Produção** ou **Teste** correta)
- [ ] Webhook no painel MP → `/api/webhooks/mercadopago` → `MERCADOPAGO_WEBHOOK_SECRET`
- [ ] Confirmar `MERCADOPAGO_USE_SANDBOX=false` em produção
- [ ] (Recomendado) Testar com outra conta MP real em janela anônima

### Política de cobrança (fixada)

1. Ao finalizar o cadastro da oficina → PreApproval Mercado Pago (14 dias trial).
2. Cliente **cadastra o cartão** no checkout MP.
3. Assinatura entra em **trial de 14 dias** (R$ 0 nesse período).
4. No dia 15 o Mercado Pago **cobra automaticamente** o plano (mensal R$ 97 ou anual R$ 970).
5. Se não houver pagamento válido no fim do trial → assinatura **cancela** ou entra em inadimplência (grace 3 dias).

## Vercel + domínio

- [ ] Inicializar git no monorepo e publicar no GitHub (privado)
- [ ] New Project na Vercel → Root Directory = `apps/web`
- [ ] Conferir Install/Build (já em `apps/web/vercel.json`)
- [ ] Variáveis de ambiente de produção = todas do `.env.example` (valores reais)
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
