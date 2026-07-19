-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN "work_authorized_at" TIMESTAMP(3);
ALTER TABLE "service_orders" ADD COLUMN "work_authorized_by" TEXT;
ALTER TABLE "service_orders" ADD COLUMN "work_authorized_notes" TEXT;
ALTER TABLE "service_orders" ADD COLUMN "work_authorized_method" TEXT;
