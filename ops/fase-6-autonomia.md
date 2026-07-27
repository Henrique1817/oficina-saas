# Fase 6 — Autonomia

Meta: o produto **roda sozinho** no dia a dia — cobrança, alertas e scorecard — enquanto você foca em vendas até **15–20 ACTIVE**.

## O que entrou no código

| Automação | Onde | Quando |
|-----------|------|--------|
| Trial acabando | `/api/v1/cron/trial-ending` | 09:00 UTC diário |
| Estoque baixo → e-mail ADMIN/MANAGER | `/api/v1/cron/low-stock` | 08:00 UTC diário |
| Dunning PAST_DUE (grace 3 dias) | `/api/v1/cron/dunning` | 10:00 UTC diário |
| Soft access PAST_DUE | `access-policy` + middleware | imediato |
| Banner “regularizar” | `DashboardShell` | enquanto grace > 0 |
| Scorecard autonomia | `/admin/growth` | sob demanda |

## Grace PAST_DUE

1. Webhook Mercado Pago (`subscription_authorized_payment` / falha) → `planStatus=PAST_DUE` + `pastDueAt` (1ª vez).
2. Durante **3 dias** o tenant ainda entra (banner + e-mails de dunning).
3. Depois do grace: middleware/API bloqueiam → `/billing`.
4. Pagamento ok → `ACTIVE` e `pastDueAt=null`.

## Checklist operacional (semanal)

1. Abrir console `http://localhost:3001/saude` (ou `/` overview) — scorecard + MRR + meta ACTIVE.
2. Clicar **Exportar metrics.csv** (opcional; substitui editar `ops/metrics.csv` à mão).
3. Conferir crons com último run &lt; 48h; se vazios, disparar/verificar Vercel Cron.
4. Conferir Resend: trials, dunning, estoque baixo.
5. Mercado Pago: PAST_DUE sem ação humana além do e-mail automático.
6. Se `CRON_SECRET` / Resend / `MERCADOPAGO_*` faltarem, crons e mails não disparam.

## Critério de saída

- [ ] Crons ativos em produção (Vercel → Cron Jobs)
- [ ] Pelo menos 1 ciclo real de trial-ending **ou** dunning com e-mail entregue
- [ ] PAST_DUE testado (sandbox Mercado Pago) com banner + bloqueio após 3 dias
- [ ] 15–20 orgs `ACTIVE` (meta comercial; código não bloqueia)

## Env necessários

```
CRON_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
PLATFORM_ADMIN_EMAILS=
```
