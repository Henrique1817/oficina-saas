-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "billing_exempt" BOOLEAN NOT NULL DEFAULT false;

-- Owner / Legacy: cortesia se já existir
UPDATE "organizations"
SET "billing_exempt" = true
WHERE "slug" = 'legacy' AND "billing_exempt" = false;
