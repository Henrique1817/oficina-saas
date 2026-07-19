-- Multi-tenant: organizations, memberships, organizationId backfill

CREATE TYPE "PlanStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "plan_status" "PlanStatus" NOT NULL DEFAULT 'TRIALING',
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "organizations_stripe_customer_id_key" ON "organizations"("stripe_customer_id");
CREATE UNIQUE INDEX "organizations_stripe_subscription_id_key" ON "organizations"("stripe_subscription_id");

CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MECHANIC',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "memberships_organization_id_user_id_key" ON "memberships"("organization_id", "user_id");
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

CREATE TABLE "organization_invites" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MECHANIC',
    "token" TEXT NOT NULL,
    "invited_by_id" UUID,
    "accepted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_invites_token_key" ON "organization_invites"("token");
CREATE INDEX "organization_invites_organization_id_email_idx" ON "organization_invites"("organization_id", "email");
CREATE INDEX "organization_invites_token_idx" ON "organization_invites"("token");

-- Default org for existing single-tenant data
INSERT INTO "organizations" ("id", "name", "slug", "plan_status", "trial_ends_at", "created_at", "updated_at")
VALUES (
  'org_default_oficina',
  'Oficina Principal',
  'oficina-principal',
  'ACTIVE',
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

ALTER TABLE "customers" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "vehicle_variants" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "vehicles" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "stock_locations" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "parts" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "inventory_movements" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "tools" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "service_orders" ADD COLUMN "organization_id" TEXT;

UPDATE "customers" SET "organization_id" = 'org_default_oficina' WHERE "organization_id" IS NULL;
UPDATE "vehicle_variants" SET "organization_id" = 'org_default_oficina' WHERE "organization_id" IS NULL;
UPDATE "vehicles" SET "organization_id" = 'org_default_oficina' WHERE "organization_id" IS NULL;
UPDATE "stock_locations" SET "organization_id" = 'org_default_oficina' WHERE "organization_id" IS NULL;
UPDATE "parts" SET "organization_id" = 'org_default_oficina' WHERE "organization_id" IS NULL;
UPDATE "inventory_movements" SET "organization_id" = 'org_default_oficina' WHERE "organization_id" IS NULL;
UPDATE "tools" SET "organization_id" = 'org_default_oficina' WHERE "organization_id" IS NULL;
UPDATE "service_orders" SET "organization_id" = 'org_default_oficina' WHERE "organization_id" IS NULL;

-- Memberships from existing profiles (role copied from profile)
INSERT INTO "memberships" ("id", "organization_id", "user_id", "role", "active", "created_at", "updated_at")
SELECT
  'mem_' || "id"::text,
  'org_default_oficina',
  "id",
  "role",
  "active",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "profiles";

ALTER TABLE "customers" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "vehicle_variants" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "vehicles" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "stock_locations" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "parts" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "inventory_movements" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "tools" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "service_orders" ALTER COLUMN "organization_id" SET NOT NULL;

-- Drop old global uniques
DROP INDEX IF EXISTS "vehicle_variants_make_model_year_start_year_end_engine_key";
DROP INDEX IF EXISTS "vehicles_plate_key";
DROP INDEX IF EXISTS "stock_locations_name_key";
DROP INDEX IF EXISTS "parts_sku_key";
DROP INDEX IF EXISTS "tools_asset_code_key";
DROP INDEX IF EXISTS "service_orders_order_number_key";
DROP INDEX IF EXISTS "customers_name_idx";
DROP INDEX IF EXISTS "customers_phone_idx";
DROP INDEX IF EXISTS "vehicle_variants_make_model_idx";
DROP INDEX IF EXISTS "parts_name_idx";
DROP INDEX IF EXISTS "service_orders_status_idx";
DROP INDEX IF EXISTS "service_orders_customer_id_idx";
DROP INDEX IF EXISTS "inventory_movements_part_id_created_at_idx";

-- New org-scoped uniques / indexes
CREATE UNIQUE INDEX "vehicle_variants_organization_id_make_model_year_start_year_end_engine_key"
  ON "vehicle_variants"("organization_id", "make", "model", "year_start", "year_end", "engine");
CREATE INDEX "vehicle_variants_organization_id_make_model_idx" ON "vehicle_variants"("organization_id", "make", "model");

CREATE UNIQUE INDEX "vehicles_organization_id_plate_key" ON "vehicles"("organization_id", "plate");
CREATE INDEX "vehicles_organization_id_customer_id_idx" ON "vehicles"("organization_id", "customer_id");

CREATE UNIQUE INDEX "stock_locations_organization_id_name_key" ON "stock_locations"("organization_id", "name");

CREATE UNIQUE INDEX "parts_organization_id_sku_key" ON "parts"("organization_id", "sku");
CREATE INDEX "parts_organization_id_name_idx" ON "parts"("organization_id", "name");

CREATE UNIQUE INDEX "tools_organization_id_asset_code_key" ON "tools"("organization_id", "asset_code");

CREATE UNIQUE INDEX "service_orders_organization_id_order_number_key" ON "service_orders"("organization_id", "order_number");
CREATE INDEX "service_orders_organization_id_status_idx" ON "service_orders"("organization_id", "status");
CREATE INDEX "service_orders_organization_id_customer_id_idx" ON "service_orders"("organization_id", "customer_id");

CREATE INDEX "customers_organization_id_name_idx" ON "customers"("organization_id", "name");
CREATE INDEX "customers_organization_id_phone_idx" ON "customers"("organization_id", "phone");

CREATE INDEX "inventory_movements_organization_id_part_id_created_at_idx"
  ON "inventory_movements"("organization_id", "part_id", "created_at");

-- Foreign keys
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invited_by_id_fkey"
  FOREIGN KEY ("invited_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_variants" ADD CONSTRAINT "vehicle_variants_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parts" ADD CONSTRAINT "parts_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tools" ADD CONSTRAINT "tools_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
