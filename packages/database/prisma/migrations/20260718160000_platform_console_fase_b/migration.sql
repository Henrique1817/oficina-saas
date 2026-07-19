-- AlterTable
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "suspended_at" TIMESTAMP(3);
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "internal_note" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "platform_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "actor_email" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "organization_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "platform_impersonation_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "actor_email" TEXT NOT NULL,
    "reason" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_impersonation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "platform_audit_logs_organization_id_created_at_idx" ON "platform_audit_logs"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_actor_user_id_created_at_idx" ON "platform_audit_logs"("actor_user_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "platform_impersonation_tokens_token_key" ON "platform_impersonation_tokens"("token");
CREATE INDEX IF NOT EXISTS "platform_impersonation_tokens_token_idx" ON "platform_impersonation_tokens"("token");
CREATE INDEX IF NOT EXISTS "platform_impersonation_tokens_organization_id_idx" ON "platform_impersonation_tokens"("organization_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "platform_audit_logs" ADD CONSTRAINT "platform_audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "platform_impersonation_tokens" ADD CONSTRAINT "platform_impersonation_tokens_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
