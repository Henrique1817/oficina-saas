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
      include: { vehicles: { include: { variant: true } } },
    });
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
