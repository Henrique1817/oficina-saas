-- Soft launch cohort (design partners)
ALTER TABLE "organizations" ADD COLUMN "design_partner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organizations" ADD COLUMN "design_partner_contact" TEXT;

CREATE INDEX "organizations_design_partner_idx" ON "organizations"("design_partner");
