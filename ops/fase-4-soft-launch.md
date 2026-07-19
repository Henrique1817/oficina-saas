# Fase 4 — Soft launch & dogfood

Objetivo: você + 3–5 oficinas usando de verdade; Stripe live; fricções só as que impedem renovar.

## 1. Dogfood (sua oficina)

- [ ] Rodar migrações + seed (já feito se schema multi-tenant ok)
- [ ] Criar usuário real no Supabase Auth e membership ADMIN na org (ou usar `/signup`)
- [ ] Completar checklist em `/admin/go-live`
- [ ] Fluxo manual: cliente → veículo → OS → orçamento → WhatsApp/PDF → faturada
- [ ] Entrada de estoque + editar preço de peça
- [ ] Convidar 1 mecânico e aceitar o link
- [ ] 1 cobrança Stripe **live** (sua) após trial ou com price de teste controlado

## 2. Design partners (3–5)

Critérios de escolha: dono no WhatsApp, 1–3 boxes, sofrendo com papel/planilha.

Para cada partner:

| Campo | Exemplo |
|-------|---------|
| Nome da oficina | |
| Contato | |
| Data do onboarding | |
| Trial até | |
| Status | convite / ativo / churn |
| Fricção #1 | |
| Bloqueia renovar? | sim/não |

Planilha: `ops/design-partners.csv`  
Log de bugs: `ops/friction-log.csv`

### Roteiro da call (30–40 min)

1. Criar conta juntos (`/signup`) ou convite
2. Completar `/onboarding/setup`
3. Cadastrar 1 OS real do dia
4. Pedir: “o que te faria cancelar em 14 dias?”
5. Anotar só o que **impede** usar de novo amanhã

## 3. Stripe live

- [ ] Keys live no `.env` / Vercel
- [ ] Webhook produção → `/api/v1/billing/webhook`
- [ ] Customer Portal ativo
- [ ] 1 pagamento real processado
- [ ] Testar cancelamento / PAST_DUE (cartão falha)

## 4. Critério de saída da Fase 4

- Você usando 100% no dia a dia **ou** org seed substituída por dados reais
- ≥ 3 oficinas ativas no trial/pago
- Lista priorizada em `friction-log.csv` (top 5)
- Sem bug P0 no fluxo OS → orçamento → faturada

## Fora de escopo (não fazer agora)

NF-e, multi-filial, app mobile, white-label, landing “bonita demais”.
