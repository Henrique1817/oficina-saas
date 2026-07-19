# Fase 2 — Billing

## Fluxo
1. `/signup` → cria user Supabase + org + membership ADMIN
2. Se Stripe configurado → Checkout (14 dias trial + cartão obrigatório)
3. Webhook sincroniza `organizations.plan_status`
4. Middleware bloqueia app se `PAST_DUE` / `CANCELED` / trial expirado → `/billing`
5. `withAuth` aplica o mesmo gate nas APIs `/api/v1/*` → **402** `SUBSCRIPTION_REQUIRED` (exceto checkout/portal e `/me`)

## Env necessárias
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (opcional no server checkout)
- `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

## Webhook Stripe
Endpoint: `POST {NEXT_PUBLIC_APP_URL}/api/v1/billing/webhook`

Eventos:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Dashboard: https://dashboard.stripe.com/webhooks

## Sem Stripe no .env
Signup ainda cria a oficina em `TRIALING` (14 dias). Checkout fica para `/billing` depois.
