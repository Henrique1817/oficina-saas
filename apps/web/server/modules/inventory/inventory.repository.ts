import { prisma, type InventoryMovementType, type Prisma } from "@oficina/database";
import type { CreatePartInput, StockMovementInput, UpdatePartInput } from "@oficina/shared";

export const inventoryRepository = {
  async listParts(
    organizationId: string,
    params: {
      q?: string;
      variantId?: string;
      lowStock?: boolean;
      cursor?: string;
      limit: number;
    },
  ) {
    const where: Prisma.PartWhereInput = { organizationId, active: true };
    if (params.q) {
      where.OR = [
        { sku: { contains: params.q, mode: "insensitive" } },
        { name: { contains: params.q, mode: "insensitive" } },
      ];
    }
    if (params.variantId) {
      where.fitments = { some: { variantId: params.variantId } };
    }

    // Estoque baixo exige agregação — buscar lote maior e filtrar em memória
    const take = params.lowStock ? Math.max(params.limit * 5, 200) : params.limit + 1;

    const parts = await prisma.part.findMany({
      where,
      take,
      ...(params.cursor && !params.lowStock ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { name: "asc" },
      include: {
        stockItems: { include: { location: true } },
        fitments: { include: { variant: true } },
      },
    });

    let filtered = parts;
    if (params.lowStock) {
      filtered = parts.filter((p) => {
        const total = p.stockItems.reduce((s, i) => s + i.quantity - i.reservedQty, 0);
        return total <= p.minQuantity;
      });
    }

    const hasMore = filtered.length > params.limit;
    const data = hasMore ? filtered.slice(0, params.limit) : filtered;
    return { data, nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null, hasMore };
  },

  async getPart(organizationId: string, id: string) {
    return prisma.part.findFirst({
      where: { id, organizationId },
      include: {
        stockItems: { include: { location: true } },
        fitments: { include: { variant: true } },
      },
    });
  },

  async createPart(organizationId: string, input: CreatePartInput) {
    const { variantIds, ...partData } = input;
    return prisma.part.create({
      data: {
        ...partData,
        organizationId,
        fitments: variantIds?.length
          ? { create: variantIds.map((variantId) => ({ variantId })) }
          : undefined,
      },
      include: { fitments: true, stockItems: true },
    });
  },

  async updatePart(organizationId: string, id: string, input: UpdatePartInput) {
    const existing = await prisma.part.findFirst({ where: { id, organizationId } });
    if (!existing) return null;

    const { variantIds, ...partData } = input;
    return prisma.$transaction(async (tx) => {
      if (variantIds) {
        await tx.partVehicleFitment.deleteMany({ where: { partId: id } });
        if (variantIds.length) {
          await tx.partVehicleFitment.createMany({
            data: variantIds.map((variantId) => ({ partId: id, variantId })),
          });
        }
      }
      return tx.part.update({
        where: { id },
        data: partData,
        include: { fitments: true, stockItems: { include: { location: true } } },
      });
    });
  },

  async listLocations(organizationId: string) {
    return prisma.stockLocation.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  },

  async getLowStockParts(organizationId: string) {
    const parts = await prisma.part.findMany({
      where: { organizationId, active: true },
      include: { stockItems: true },
    });
    return parts.filter((p) => {
      const available = p.stockItems.reduce((s, i) => s + i.quantity - i.reservedQty, 0);
      return available <= p.minQuantity;
    });
  },

  async applyMovement(organizationId: string, input: StockMovementInput, createdById: string) {
    return prisma.$transaction(async (tx) => {
      const part = await tx.part.findFirst({ where: { id: input.partId, organizationId } });
      if (!part) throw new Error("PART_NOT_FOUND");

      const location = await tx.stockLocation.findFirst({
        where: { id: input.locationId, organizationId },
      });
      if (!location) throw new Error("LOCATION_NOT_FOUND");

      const stock = await tx.stockItem.findUnique({
        where: { partId_locationId: { partId: input.partId, locationId: input.locationId } },
      });

      const delta =
        input.type === "IN" || input.type === "ADJUSTMENT"
          ? input.quantity
          : -input.quantity;

      const currentQty = stock?.quantity ?? 0;
      const newQty = input.type === "ADJUSTMENT" ? input.quantity : currentQty + delta;

      if (newQty < 0) throw new Error("INSUFFICIENT_STOCK");

      await tx.stockItem.upsert({
        where: { partId_locationId: { partId: input.partId, locationId: input.locationId } },
        create: {
          partId: input.partId,
          locationId: input.locationId,
          quantity: Math.max(0, newQty),
        },
        update: { quantity: Math.max(0, newQty) },
      });

      return tx.inventoryMovement.create({
        data: {
          organizationId,
          partId: input.partId,
          locationId: input.locationId,
          type: input.type as InventoryMovementType,
          quantity: input.quantity,
          notes: input.notes,
          reference: input.reference,
          createdById,
        },
      });
    });
  },
};
