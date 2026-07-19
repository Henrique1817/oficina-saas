-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PlatformRole" AS ENUM ('OWNER', 'SUPPORT', 'FINANCE', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "platform_users" (
  "id" TEXT NOT NULL,
  "user_id" UUID,
  "email" TEXT NOT NULL,
  "role" "PlatformRole" NOT NULL DEFAULT 'VIEWER',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "invited_by_email" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "platform_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "platform_users_user_id_key" ON "platform_users"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "platform_users_email_key" ON "platform_users"("email");
CREATE INDEX IF NOT EXISTS "platform_users_active_role_idx" ON "platform_users"("active", "role");

-- Seed OWNER from PLATFORM_ADMIN_EMAILS is done at first login (apps/admin).
-- Optional known owner email if empty table:
INSERT INTO "platform_users" ("id", "email", "role", "active", "created_at", "updated_at")
SELECT
  'seed_owner_legacy',
  'henrimi4710@gmail.com',
  'OWNER'::"PlatformRole",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "platform_users" LIMIT 1);
