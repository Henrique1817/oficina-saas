-- Orçamento: envio, aprovação e reprovação
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "quote_sent_at" TIMESTAMP(3);
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "quote_approved_at" TIMESTAMP(3);
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "quote_rejected_at" TIMESTAMP(3);
ALTER TABLE "service_orders" ADD COLUMN IF NOT EXISTS "quote_rejection_notes" TEXT;
