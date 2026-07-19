-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'MECHANIC');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'OS_CONSUMPTION', 'OS_RESERVATION', 'OS_RELEASE');

-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ToolMaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('DRAFT', 'APPROVED', 'IN_PROGRESS', 'DONE', 'INVOICED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceOrderLineType" AS ENUM ('PART', 'SERVICE');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MECHANIC',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "document" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_variants" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year_start" INTEGER,
    "year_end" INTEGER,
    "engine" TEXT,
    "transmission" TEXT,
    "notes" TEXT,

    CONSTRAINT "vehicle_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "plate" TEXT NOT NULL,
    "color" TEXT,
    "vin" TEXT,
    "mileage" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "min_quantity" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_vehicle_fitments" (
    "id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "part_vehicle_fitments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_qty" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "location_id" TEXT,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" TEXT,
    "service_order_id" TEXT,
    "created_by_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" TEXT NOT NULL,
    "asset_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ToolStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_checkouts" (
    "id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "checked_out_by_id" UUID NOT NULL,
    "service_order_id" TEXT,
    "checked_out_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returned_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "tool_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_maintenances" (
    "id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "status" "ToolMaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "cost" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "order_number" SERIAL NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "assigned_mechanic_id" UUID,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "internal_notes" TEXT,
    "parent_service_order_id" TEXT,
    "parts_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "labor_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "invoiced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_lines" (
    "id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "type" "ServiceOrderLineType" NOT NULL,
    "part_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_labor" (
    "id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "mechanic_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "hourly_rate" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_labor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_status_history" (
    "id" TEXT NOT NULL,
    "service_order_id" TEXT NOT NULL,
    "from_status" "ServiceOrderStatus",
    "to_status" "ServiceOrderStatus" NOT NULL,
    "changed_by_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");
CREATE INDEX "customers_name_idx" ON "customers"("name");
CREATE INDEX "customers_phone_idx" ON "customers"("phone");
CREATE UNIQUE INDEX "vehicle_variants_make_model_year_start_year_end_engine_key" ON "vehicle_variants"("make", "model", "year_start", "year_end", "engine");
CREATE INDEX "vehicle_variants_make_model_idx" ON "vehicle_variants"("make", "model");
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");
CREATE INDEX "vehicles_customer_id_idx" ON "vehicles"("customer_id");
CREATE UNIQUE INDEX "stock_locations_name_key" ON "stock_locations"("name");
CREATE UNIQUE INDEX "parts_sku_key" ON "parts"("sku");
CREATE INDEX "parts_name_idx" ON "parts"("name");
CREATE UNIQUE INDEX "part_vehicle_fitments_part_id_variant_id_key" ON "part_vehicle_fitments"("part_id", "variant_id");
CREATE INDEX "part_vehicle_fitments_variant_id_idx" ON "part_vehicle_fitments"("variant_id");
CREATE UNIQUE INDEX "stock_items_part_id_location_id_key" ON "stock_items"("part_id", "location_id");
CREATE INDEX "stock_items_part_id_idx" ON "stock_items"("part_id");
CREATE INDEX "inventory_movements_part_id_created_at_idx" ON "inventory_movements"("part_id", "created_at");
CREATE INDEX "inventory_movements_service_order_id_idx" ON "inventory_movements"("service_order_id");
CREATE UNIQUE INDEX "tools_asset_code_key" ON "tools"("asset_code");
CREATE INDEX "tool_checkouts_tool_id_returned_at_idx" ON "tool_checkouts"("tool_id", "returned_at");
CREATE INDEX "tool_maintenances_tool_id_status_idx" ON "tool_maintenances"("tool_id", "status");
CREATE UNIQUE INDEX "service_orders_order_number_key" ON "service_orders"("order_number");
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");
CREATE INDEX "service_orders_customer_id_idx" ON "service_orders"("customer_id");
CREATE INDEX "service_orders_vehicle_id_idx" ON "service_orders"("vehicle_id");
CREATE INDEX "service_orders_assigned_mechanic_id_idx" ON "service_orders"("assigned_mechanic_id");
CREATE INDEX "service_order_lines_service_order_id_idx" ON "service_order_lines"("service_order_id");
CREATE INDEX "service_order_labor_service_order_id_idx" ON "service_order_labor"("service_order_id");
CREATE INDEX "service_order_status_history_service_order_id_created_at_idx" ON "service_order_status_history"("service_order_id", "created_at");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "vehicle_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "part_vehicle_fitments" ADD CONSTRAINT "part_vehicle_fitments_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "part_vehicle_fitments" ADD CONSTRAINT "part_vehicle_fitments_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "vehicle_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tool_checkouts" ADD CONSTRAINT "tool_checkouts_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tool_checkouts" ADD CONSTRAINT "tool_checkouts_checked_out_by_id_fkey" FOREIGN KEY ("checked_out_by_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tool_checkouts" ADD CONSTRAINT "tool_checkouts_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tool_maintenances" ADD CONSTRAINT "tool_maintenances_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_assigned_mechanic_id_fkey" FOREIGN KEY ("assigned_mechanic_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_parent_service_order_id_fkey" FOREIGN KEY ("parent_service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_order_lines" ADD CONSTRAINT "service_order_lines_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_order_lines" ADD CONSTRAINT "service_order_lines_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_order_labor" ADD CONSTRAINT "service_order_labor_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_order_labor" ADD CONSTRAINT "service_order_labor_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_order_status_history" ADD CONSTRAINT "service_order_status_history_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_order_status_history" ADD CONSTRAINT "service_order_status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS (defense in depth — deny anon/authenticated direct API access)
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehicle_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "part_vehicle_fitments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tool_checkouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tool_maintenances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_order_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_order_labor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_order_status_history" ENABLE ROW LEVEL SECURITY;
