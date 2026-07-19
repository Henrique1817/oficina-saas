-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "vehicle_model" TEXT;
ALTER TABLE "vehicles" ADD COLUMN "vehicle_year" INTEGER;
ALTER TABLE "vehicles" ADD COLUMN "reported_issue" TEXT;

UPDATE "vehicles" SET "vehicle_model" = COALESCE(
  (SELECT vv.model FROM "vehicle_variants" vv WHERE vv.id = "vehicles"."variant_id"),
  'Não informado'
) WHERE "vehicle_model" IS NULL;

UPDATE "vehicles" SET "vehicle_model" = 'Não informado' WHERE "vehicle_model" IS NULL;

ALTER TABLE "vehicles" ALTER COLUMN "vehicle_model" SET NOT NULL;
