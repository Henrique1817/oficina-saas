-- Stripe → Mercado Pago: renomeia colunas de billing e cria claims de webhook

ALTER TABLE "organizations" RENAME COLUMN "stripe_customer_id" TO "mp_payer_id";
ALTER TABLE "organizations" RENAME COLUMN "stripe_subscription_id" TO "mp_preapproval_id";

ALTER TABLE "organizations" ADD COLUMN "mp_plan_id" TEXT;

ALTER INDEX "organizations_stripe_customer_id_key" RENAME TO "organizations_mp_payer_id_key";
ALTER INDEX "organizations_stripe_subscription_id_key" RENAME TO "organizations_mp_preapproval_id_key";

CREATE TABLE "billing_webhook_claims" (
    "id" TEXT NOT NULL,
    "claim_key" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "topic" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_webhook_claims_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_webhook_claims_claim_key_key" ON "billing_webhook_claims"("claim_key");
CREATE INDEX "billing_webhook_claims_status_created_at_idx" ON "billing_webhook_claims"("status", "created_at");
