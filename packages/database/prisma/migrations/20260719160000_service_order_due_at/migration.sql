-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN "due_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "service_orders_organization_id_due_at_idx" ON "service_orders"("organization_id", "due_at");
