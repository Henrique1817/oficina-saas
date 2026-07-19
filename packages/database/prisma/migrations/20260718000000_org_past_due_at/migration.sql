-- Soft dunning: track when PAST_DUE started
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "past_due_at" TIMESTAMP(3);
