/**
 * Apaga TODOS os dados de negócio e plataforma no Postgres.
 *
 * Uso:
 *   CONFIRM=WIPE_ALL pnpm --filter @oficina/database db:wipe
 *
 * Não remove usuários do Supabase Auth (só profiles/memberships no Prisma).
 * No próximo login, o profile pode ser recriado automaticamente.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function countAll() {
  const [
    organizations,
    profiles,
    memberships,
    customers,
    vehicles,
    parts,
    serviceOrders,
    tools,
    platformUsers,
    pipelineRuns,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.profile.count(),
    prisma.membership.count(),
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.part.count(),
    prisma.serviceOrder.count(),
    prisma.tool.count(),
    prisma.platformUser.count(),
    prisma.platformPipelineRun.count(),
  ]);
  return {
    organizations,
    profiles,
    memberships,
    customers,
    vehicles,
    parts,
    serviceOrders,
    tools,
    platformUsers,
    pipelineRuns,
  };
}

async function main() {
  if (process.env.CONFIRM !== "WIPE_ALL") {
    console.error("Abortado. Defina CONFIRM=WIPE_ALL para confirmar.");
    process.exit(1);
  }

  console.log("Contagem ANTES:", await countAll());

  // Ordem respeita FKs Restrict (OS→customer/vehicle, labor→profile, checkout→profile)
  await prisma.$transaction(async (tx) => {
    await tx.serviceOrderStatusHistory.deleteMany();
    await tx.serviceOrderLabor.deleteMany();
    await tx.serviceOrderLine.deleteMany();
    await tx.toolCheckout.deleteMany();
    await tx.toolMaintenance.deleteMany();
    await tx.inventoryMovement.deleteMany();
    await tx.stockItem.deleteMany();
    await tx.partVehicleFitment.deleteMany();
    await tx.serviceOrder.deleteMany();
    await tx.part.deleteMany();
    await tx.tool.deleteMany();
    await tx.vehicle.deleteMany();
    await tx.vehicleVariant.deleteMany();
    await tx.customer.deleteMany();
    await tx.stockLocation.deleteMany();
    await tx.organizationInvite.deleteMany();
    await tx.membership.deleteMany();
    await tx.platformImpersonationToken.deleteMany();
    await tx.platformAuditLog.deleteMany();
    await tx.platformPipelineStep.deleteMany();
    await tx.platformPipelineRun.deleteMany();
    await tx.platformCronRun.deleteMany();
    await tx.organization.deleteMany();
    await tx.profile.deleteMany();
    await tx.platformUser.deleteMany();
  });

  console.log("Contagem DEPOIS:", await countAll());
  console.log("Wipe concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
