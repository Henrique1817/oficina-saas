# Fase 2 — Billing (Mercado Pago)

## Fluxo
1. `/signup` → cria user Supabase + org + membership ADMIN
2. Se Mercado Pago configurado → PreApproval (14 dias trial + checkout MP)
3. Webhook sincroniza `organizations.plan_status` (reconsulta API oficial)
4. Middleware bloqueia app se `PAST_DUE` / `CANCELED` / trial expirado → `/billing`
5. `withAuth` aplica o mesmo gate nas APIs `/api/v1/*` → **402** `SUBSCRIPTION_REQUIRED` (exceto checkout/portal e `/me`)

## Env necessárias
- `MERCADOPAGO_ACCESS_TOKEN` (Produção: aba **Produção**; Teste: `TEST-…`)
- `MERCADOPAGO_WEBHOOK_SECRET` (obrigatório em produção)
- `MERCADOPAGO_USE_SANDBOX=false` em produção (nunca misturar `sandbox_init_point` com token de produção)
- `NEXT_PUBLIC_APP_URL` (sem barra final)

## Webhook Mercado Pago
Endpoint: `POST {NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`

Health: `GET` → `{ ok: true, service: "mercadopago-webhook" }`

Tópicos:
- `subscription_preapproval`
- `subscription_authorized_payment`
- `payment`

Validação: HMAC `x-signature` + `x-request-id` + `data.id` (manifesto oficial).
Após validar: **GET** na API MP (não confiar no body) + claim idempotente.

Painel: Suas integrações → Webhooks

## Sem Mercado Pago no .env
Signup ainda cria a oficina em `TRIALING` (14 dias). Checkout fica para `/billing` depois.

## Armadilhas
1. Token `APP_USR-` existe em teste e produção — copiar da aba certa.
2. App com `sandbox_mode: true` no painel MP quebra pagamento real.
3. Vendedor não pode assinar o próprio plano com a mesma conta MP.
4. Testar com outra conta MP real em janela anônima.
5. Após mudar env na Vercel: **redeploy**.
