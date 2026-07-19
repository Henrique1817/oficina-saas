import { prisma, type Prisma } from "@oficina/database";

type Tx = Prisma.TransactionClient;

export class ServiceOrderInventoryError extends Error {
  constructor(
    message: string,
    readonly code: "INSUFFICIENT_STOCK" | "NO_STOCK_LOCATION",
    readonly partId?: string,
  ) {
    super(message);
    this.name = "ServiceOrderInventoryError";
  }
}

export async function getDefaultLocationId(organizationId: string, tx?: Tx): Promise<string> {
  const client = tx ?? prisma;
  const location = await client.stockLocation.findFirst({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
  if (!location) throw new ServiceOrderInventoryError("No stock location configured", "NO_STOCK_LOCATION");
  return location.id;
}

export async function getAvailableQty(partId: string, locationId: string, tx?: Tx): Promise<number> {
  const client = tx ?? prisma;
  const stock = await client.stockItem.findUnique({
    where: { partId_locationId: { partId, locationId } },
  });
  return (stock?.quantity ?? 0) - (stock?.reservedQty ?? 0);
}

export async function reservePartForOrder(params: {
  organizationId: string;
  partId: string;
  quantity: number;
  serviceOrderId: string;
  userId: string;
  locationId?: string;
}) {
  const qty = Math.ceil(params.quantity);
  if (qty <= 0) return;

  return prisma.$transaction(async (tx) => {
    const locationId = params.locationId ?? (await getDefaultLocationId(params.organizationId, tx));
    const available = await getAvailableQty(params.partId, locationId, tx);
    if (available < qty) {
      throw new ServiceOrderInventoryError("Insufficient stock", "INSUFFICIENT_STOCK", params.partId);
    }

    await tx.stockItem.upsert({
      where: { partId_locationId: { partId: params.partId, locationId } },
      create: { partId: params.partId, locationId, quantity: 0, reservedQty: qty },
      update: { reservedQty: { increment: qty } },
    });

    await tx.inventoryMovement.create({
      data: {
        organizationId: params.organizationId,
        partId: params.partId,
        locationId,
        type: "OS_RESERVATION",
        quantity: qty,
        serviceOrderId: params.serviceOrderId,
        createdById: params.userId,
        reference: `OS-reserve-${params.serviceOrderId}`,
        notes: "Reserva para ordem de serviço",
      },
    });
  });
}

export async function releasePartForOrder(params: {
  organizationId: string;
  partId: string;
  quantity: number;
  serviceOrderId: string;
  userId: string;
  locationId?: string;
}) {
  const qty = Math.ceil(params.quantity);
  if (qty <= 0) return;

  return prisma.$transaction(async (tx) => {
    const locationId = params.locationId ?? (await getDefaultLocationId(params.organizationId, tx));
    const stock = await tx.stockItem.findUnique({
      where: { partId_locationId: { partId: params.partId, locationId } },
    });
    if (!stock || stock.reservedQty <= 0) return;

    const releaseQty = Math.min(qty, stock.reservedQty);

    await tx.stockItem.update({
      where: { partId_locationId: { partId: params.partId, locationId } },
      data: { reservedQty: { decrement: releaseQty } },
    });

    await tx.inventoryMovement.create({
      data: {
        organizationId: params.organizationId,
        partId: params.partId,
        locationId,
        type: "OS_RELEASE",
        quantity: releaseQty,
        serviceOrderId: params.serviceOrderId,
        createdById: params.userId,
        reference: `OS-release-${params.serviceOrderId}`,
        notes: "Liberação de reserva (cancelamento ou ajuste)",
      },
    });
  });
}

export async function releaseAllReservationsForOrder(
  organizationId: string,
  serviceOrderId: string,
  userId: string,
) {
  const order = await prisma.serviceOrder.findFirst({
    where: { id: serviceOrderId, organizationId },
  });
  if (!order) return;

  const lines = await prisma.serviceOrderLine.findMany({
    where: { serviceOrderId, type: "PART", partId: { not: null } },
  });

  for (const line of lines) {
    if (!line.partId) continue;
    await releasePartForOrder({
      organizationId,
      partId: line.partId,
      quantity: Number(line.quantity),
      serviceOrderId,
      userId,
    });
  }
}

export async function consumePartsForOrder(
  organizationId: string,
  serviceOrderId: string,
  userId: string,
) {
  const order = await prisma.serviceOrder.findFirst({
    where: { id: serviceOrderId, organizationId },
  });
  if (!order) return;

  const lines = await prisma.serviceOrderLine.findMany({
    where: { serviceOrderId, type: "PART", partId: { not: null } },
  });

  const locationId = await getDefaultLocationId(organizationId);

  for (const line of lines) {
    if (!line.partId) continue;
    const qty = Math.ceil(Number(line.quantity));

    await prisma.$transaction(async (tx) => {
      const stock = await tx.stockItem.findUnique({
        where: { partId_locationId: { partId: line.partId!, locationId } },
      });

      if (!stock) {
        throw new ServiceOrderInventoryError("Insufficient stock", "INSUFFICIENT_STOCK", line.partId!);
      }

      const available = stock.quantity - stock.reservedQty;
      if (stock.quantity < qty || available < qty) {
        throw new ServiceOrderInventoryError("Insufficient stock", "INSUFFICIENT_STOCK", line.partId!);
      }

      const reservedRelease = Math.min(stock.reservedQty, qty);

      const stockUpdate: Prisma.StockItemUpdateInput = {
        quantity: { decrement: qty },
      };
      if (reservedRelease > 0) {
        stockUpdate.reservedQty = { decrement: reservedRelease };
      }

      await tx.stockItem.update({
        where: { partId_locationId: { partId: line.partId!, locationId } },
        data: stockUpdate,
      });

      await tx.inventoryMovement.create({
        data: {
          organizationId,
          partId: line.partId!,
          locationId,
          type: "OS_CONSUMPTION",
          quantity: qty,
          serviceOrderId,
          createdById: userId,
          reference: `OS-consume-${serviceOrderId}`,
          notes: "Baixa de estoque ao concluir OS",
        },
      });
    });
  }
}
