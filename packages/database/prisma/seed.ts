import {
  PrismaClient,
  UserRole,
  ToolStatus,
  ServiceOrderStatus,
  InventoryMovementType,
} from "@prisma/client";

const prisma = new PrismaClient();

const ORG_ID = "org_default_oficina";
const ORG_SLUG = "oficina-principal";

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const MANAGER_ID = "00000000-0000-4000-8000-000000000002";
const MECHANIC_ID = "00000000-0000-4000-8000-000000000003";

async function main() {
  await prisma.organization.upsert({
    where: { id: ORG_ID },
    update: { planStatus: "ACTIVE" },
    create: {
      id: ORG_ID,
      name: "Oficina Principal",
      slug: ORG_SLUG,
      planStatus: "ACTIVE",
    },
  });

  await prisma.profile.upsert({
    where: { id: ADMIN_ID },
    update: {},
    create: {
      id: ADMIN_ID,
      email: "admin@oficina.local",
      fullName: "Administrador",
      role: UserRole.ADMIN,
    },
  });

  await prisma.profile.upsert({
    where: { id: MANAGER_ID },
    update: {},
    create: {
      id: MANAGER_ID,
      email: "gerente@oficina.local",
      fullName: "Gerente Oficina",
      role: UserRole.MANAGER,
    },
  });

  await prisma.profile.upsert({
    where: { id: MECHANIC_ID },
    update: {},
    create: {
      id: MECHANIC_ID,
      email: "mecanico@oficina.local",
      fullName: "João Mecânico",
      role: UserRole.MECHANIC,
    },
  });

  for (const [userId, role] of [
    [ADMIN_ID, UserRole.ADMIN],
    [MANAGER_ID, UserRole.MANAGER],
    [MECHANIC_ID, UserRole.MECHANIC],
  ] as const) {
    await prisma.membership.upsert({
      where: { organizationId_userId: { organizationId: ORG_ID, userId } },
      update: { role },
      create: { organizationId: ORG_ID, userId, role },
    });
  }

  const mainLocation = await prisma.stockLocation.upsert({
    where: { organizationId_name: { organizationId: ORG_ID, name: "Oficina Principal" } },
    update: {},
    create: { organizationId: ORG_ID, name: "Oficina Principal", description: "Estoque geral" },
  });

  const r34Variant = await prisma.vehicleVariant.upsert({
    where: {
      organizationId_make_model_yearStart_yearEnd_engine: {
        organizationId: ORG_ID,
        make: "Nissan",
        model: "Skyline GT-R",
        yearStart: 1999,
        yearEnd: 2002,
        engine: "RB26DETT",
      },
    },
    update: {},
    create: {
      organizationId: ORG_ID,
      make: "Nissan",
      model: "Skyline GT-R",
      yearStart: 1999,
      yearEnd: 2002,
      engine: "RB26DETT",
      transmission: "Manual 6 marchas",
    },
  });

  const supraVariant = await prisma.vehicleVariant.upsert({
    where: {
      organizationId_make_model_yearStart_yearEnd_engine: {
        organizationId: ORG_ID,
        make: "Toyota",
        model: "Supra",
        yearStart: 1993,
        yearEnd: 1998,
        engine: "2JZ-GTE",
      },
    },
    update: {},
    create: {
      organizationId: ORG_ID,
      make: "Toyota",
      model: "Supra",
      yearStart: 1993,
      yearEnd: 1998,
      engine: "2JZ-GTE",
    },
  });

  const brakePads = await prisma.part.upsert({
    where: { organizationId_sku: { organizationId: ORG_ID, sku: "BRK-PAD-SPORT-01" } },
    update: {},
    create: {
      organizationId: ORG_ID,
      sku: "BRK-PAD-SPORT-01",
      name: "Pastilha de freio esportiva",
      description: "Compatível com aplicações JDM esportivas",
      unitCost: 120,
      unitPrice: 220,
      minQuantity: 4,
    },
  });

  await prisma.partVehicleFitment.upsert({
    where: {
      partId_variantId: { partId: brakePads.id, variantId: r34Variant.id },
    },
    update: {},
    create: { partId: brakePads.id, variantId: r34Variant.id },
  });

  await prisma.partVehicleFitment.upsert({
    where: {
      partId_variantId: { partId: brakePads.id, variantId: supraVariant.id },
    },
    update: {},
    create: { partId: brakePads.id, variantId: supraVariant.id },
  });

  await prisma.stockItem.upsert({
    where: {
      partId_locationId: { partId: brakePads.id, locationId: mainLocation.id },
    },
    update: { quantity: 8 },
    create: {
      partId: brakePads.id,
      locationId: mainLocation.id,
      quantity: 8,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: { organizationId: ORG_ID },
    create: {
      id: "seed-customer-1",
      organizationId: ORG_ID,
      name: "Carlos Esportivo",
      phone: "+5511999990001",
      email: "carlos@example.com",
    },
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { organizationId_plate: { organizationId: ORG_ID, plate: "ABC1D23" } },
    update: {
      vehicleModel: "Skyline GT-R",
      vehicleYear: 2000,
      color: "Azul",
      mileage: 85000,
      reportedIssue: "Ruído ao frear; verificar pastilhas e discos",
    },
    create: {
      organizationId: ORG_ID,
      customerId: customer.id,
      variantId: r34Variant.id,
      plate: "ABC1D23",
      vehicleModel: "Skyline GT-R",
      vehicleYear: 2000,
      color: "Azul",
      mileage: 85000,
      reportedIssue: "Ruído ao frear; verificar pastilhas e discos",
    },
  });

  await prisma.tool.upsert({
    where: { organizationId_assetCode: { organizationId: ORG_ID, assetCode: "TOOL-TORQUE-001" } },
    update: {},
    create: {
      organizationId: ORG_ID,
      assetCode: "TOOL-TORQUE-001",
      name: "Chave de torque digital",
      status: ToolStatus.AVAILABLE,
    },
  });

  const existingOrder = await prisma.serviceOrder.findFirst({
    where: { organizationId: ORG_ID, vehicleId: vehicle.id },
  });

  if (!existingOrder) {
    const order = await prisma.serviceOrder.create({
      data: {
        organizationId: ORG_ID,
        orderNumber: 1,
        customerId: customer.id,
        vehicleId: vehicle.id,
        assignedMechanicId: MECHANIC_ID,
        status: ServiceOrderStatus.DRAFT,
        description: "Revisão de freios e pastilhas",
        lines: {
          create: {
            type: "PART",
            partId: brakePads.id,
            description: brakePads.name,
            quantity: 4,
            unitPrice: 220,
            total: 880,
          },
        },
        statusHistory: {
          create: {
            toStatus: ServiceOrderStatus.DRAFT,
            changedById: MANAGER_ID,
            notes: "OS criada via seed",
          },
        },
      },
    });

    await prisma.inventoryMovement.create({
      data: {
        organizationId: ORG_ID,
        partId: brakePads.id,
        locationId: mainLocation.id,
        type: InventoryMovementType.IN,
        quantity: 8,
        reference: "SEED-INITIAL",
        notes: "Estoque inicial",
        createdById: ADMIN_ID,
      },
    });

    console.log(`Seed OS #${order.orderNumber} created`);
  }

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
