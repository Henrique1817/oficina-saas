# Fase 3 — Superfície de venda

## Entregue
- Landing pública em `/` (marca Oficina, CTA trial)
- Onboarding `/onboarding/setup` (4 passos: oficina → convite → cliente → OS)
- WhatsApp no orçamento (botão com texto pronto)
- E-mails via Resend (opcional): convite, trial acabando, falha de pagamento
- Cron `GET /api/v1/cron/trial-ending` (Bearer `CRON_SECRET`)

## Env opcional
```
RESEND_API_KEY=
RESEND_FROM_EMAIL=Oficina <seu@dominio.com>
```

Sem Resend, o convite ainda gera o link na UI.
