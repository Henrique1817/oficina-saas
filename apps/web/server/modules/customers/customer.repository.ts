import { prisma } from "@oficina/database";
import type { CreateCustomerInput, UpdateCustomerInput } from "@oficina/shared";

export const customerRepository = {
  async list(organizationId: string, params: { q?: string; cursor?: string; limit: number }) {
    const where = {
      organizationId,
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: "insensitive" as const } },
              { phone: { contains: params.q } },
              { email: { contains: params.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const items = await prisma.customer.findMany({
      where,
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { vehicles: true, serviceOrders: true } } },
    });

    const hasMore = items.length > params.limit;
    const data = hasMore ? items.slice(0, -1) : items;
    return { data, nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null, hasMore };
  },

  async getById(organizationId: string, id: string) {
    return prisma.customer.findFirst({
      where: { id, organizationId },
      include: {
        vehicles: {
          include: { variant: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  /** Ficha do cliente: veículos + histórico de OS + resumo. */
  async getProfile(organizationId: string, id: string, historyLimit = 30) {
    const customer = await prisma.customer.findFirst({
      where: { id, organizationId },
      include: {
        vehicles: {
          orderBy: { createdAt: "desc" },
          include: { variant: true },
        },
        _count: { select: { vehicles: true, serviceOrders: true } },
      },
    });
    if (!customer) return null;

    const serviceOrders = await prisma.serviceOrder.findMany({
      where: { organizationId, customerId: id },
      orderBy: { createdAt: "desc" },
      take: historyLimit,
      include: {
        vehicle: {
          select: { plate: true, vehicleModel: true, vehicleYear: true },
        },
        assignedMechanic: { select: { fullName: true } },
        lines: {
          select: { type: true, description: true, part: { select: { sku: true, name: true } } },
          take: 8,
        },
      },
    });

    const [openCount, spentAgg, lastParts] = await Promise.all([
      prisma.serviceOrder.count({
        where: {
          organizationId,
          customerId: id,
          status: { in: ["DRAFT", "APPROVED", "IN_PROGRESS"] },
        },
      }),
      prisma.serviceOrder.aggregate({
        where: {
          organizationId,
          customerId: id,
          status: { in: ["DONE", "INVOICED"] },
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.serviceOrderLine.findMany({
        where: {
          type: "PART",
          partId: { not: null },
          serviceOrder: { organizationId, customerId: id },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          description: true,
          createdAt: true,
          part: { select: { sku: true, name: true } },
          serviceOrder: { select: { orderNumber: true, id: true } },
        },
      }),
    ]);

    return {
      ...customer,
      serviceOrders,
      stats: {
        openOrders: openCount,
        completedOrders: spentAgg._count,
        lifetimeSpend: Number(spentAgg._sum.total ?? 0),
        vehicleCount: customer._count.vehicles,
        orderCount: customer._count.serviceOrders,
      },
      recentParts: lastParts,
    };
  },

  async create(organizationId: string, input: CreateCustomerInput) {
    return prisma.customer.create({
      data: {
        ...input,
        organizationId,
        email: input.email || undefined,
      },
    });
  },

  async update(organizationId: string, id: string, input: UpdateCustomerInput) {
    const existing = await prisma.customer.findFirst({ where: { id, organizationId } });
    if (!existing) throw new Error("NOT_FOUND");
    return prisma.customer.update({ where: { id }, data: input });
  },

  async delete(organizationId: string, id: string) {
    const existing = await prisma.customer.findFirst({ where: { id, organizationId } });
    if (!existing) throw new Error("NOT_FOUND");
    return prisma.customer.delete({ where: { id } });
  },
};
