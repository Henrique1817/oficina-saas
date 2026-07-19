-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "phone" TEXT;
ALTER TABLE "organizations" ADD COLUMN "email" TEXT;
ALTER TABLE "organizations" ADD COLUMN "address" TEXT;
ALTER TABLE "organizations" ADD COLUMN "quote_validity_days" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "organizations" ADD COLUMN "whatsapp_templates" JSONB NOT NULL DEFAULT '[]';
