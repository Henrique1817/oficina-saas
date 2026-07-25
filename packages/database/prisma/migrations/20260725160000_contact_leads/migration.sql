-- Leads do formulário de contato do site marketing
CREATE TYPE "ContactLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'ARCHIVED');

CREATE TABLE "contact_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "workshop" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'marketing',
    "status" "ContactLeadStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_leads_created_at_idx" ON "contact_leads"("created_at");
CREATE INDEX "contact_leads_email_idx" ON "contact_leads"("email");
CREATE INDEX "contact_leads_status_idx" ON "contact_leads"("status");
