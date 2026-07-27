# Soft launch — 3–5 oficinas (item 7)

Objetivo: você + 3–5 design partners usando no dia a dia; cohort visível no console; fricções só as que impedem voltar amanhã.

## 0. Ambiente (uma vez)

```bash
pnpm --filter @oficina/database db:migrate:deploy
```

- [ ] `NEXT_PUBLIC_APP_URL` / admin URL em produção
- [ ] `NEXT_PUBLIC_WHATSAPP` (DDI+número, só dígitos) — atalho “Falar com suporte” no tenant
- [ ] `NEXT_PUBLIC_SUPPORT_EMAIL` (opcional)
- [ ] Resend (opcional; sem key, convites vão por WhatsApp)
- [ ] Mercado Pago live quando for cobrar (partners em cortesia podem esperar)

## 1. Dogfood (sua oficina)

- [ ] `/admin/go-live` zerado (cortesia ok sem assinante Mercado Pago)
- [ ] Fluxo: cliente → OS → orçamento WhatsApp/PDF → autorização → faturada
- [ ] Agenda do dia (prazos) + ferramentas na OS
- [ ] Estoque: movimento rápido + alerta baixo
- [ ] Convidar 1 mecânico
- [ ] Ficha do cliente com histórico

## 2. Design partners (3–5)

### Console

1. Abrir **admin → Pilotos** (`/pilotos`)
2. **Provisionar piloto** (nome, e-mail do dono, WhatsApp, 90 dias)
   - Cria org com `designPartner` + `billingExempt` + local de estoque
   - Se o e-mail já existe: liga membership ADMIN
   - Senão: gera link `/invite/...` (30 dias) → mandar no WhatsApp
3. Acompanhar readiness: cliente · peça · OS · faturada
4. Meta: **≥ 3 oficinas “Pronta”**

Planilha espelho: `ops/design-partners.csv`  
Bugs: `ops/friction-log.csv`

### Critérios de escolha

Dono no WhatsApp, 1–3 boxes, sofrendo com papel/planilha.

### Roteiro da call (30–40 min)

1. Abrir link do convite / login juntos
2. Completar `/onboarding/setup` (convidar mecânico se der)
3. Em **Oficina / Orçamento**: telefone, endereço, 1 template WhatsApp
4. Cadastrar **1 OS real do dia** (prazo, peças, mão de obra)
5. Mostrar: orçamento WhatsApp → autorização → movimento de estoque
6. Perguntar: “o que te faria cancelar em 14 dias?”
7. Anotar só o que **impede** usar de novo amanhã

### Alternativa sem provisionar

Parceiro faz `/signup` normal → no console marque **design partner** + **cortesia**.

## 3. Mercado Pago live (quando sair da cortesia)

- [ ] `MERCADOPAGO_ACCESS_TOKEN` de produção + `MERCADOPAGO_WEBHOOK_SECRET`
- [ ] Webhook `/api/webhooks/mercadopago` no painel MP
- [ ] `MERCADOPAGO_USE_SANDBOX=false` em produção
- [ ] 1 pagamento real (sua oficina ou partner convertendo)
- [ ] Testar PAST_DUE (grace 3 dias)

## 4. Critério de saída (item 7 “fechado” no mundo)

- Você usando no dia a dia **ou** dogfood sólido
- ≥ 3 oficinas ativas no cohort com checklist go-live ok
- `friction-log.csv` com top 5 priorizados
- Sem bug P0 no fluxo OS → orçamento → autorização → faturada

## Fora de escopo agora

NF-e, multi-filial, app nativo, white-label.
