import { prisma, ToolStatus } from "@oficina/database";
import type { CreateToolInput, ToolCheckoutInput } from "@oficina/shared";

export const toolRepository = {
  async list(organizationId: string) {
    return prisma.tool.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      include: {
        checkouts: {
          where: { returnedAt: null },
          include: { checkedOutBy: { select: { id: true, fullName: true } } },
          take: 1,
        },
        maintenances: {
          where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
          take: 1,
        },
      },
    });
  },

  async create(organizationId: string, input: CreateToolInput) {
    return prisma.tool.create({ data: { ...input, organizationId } });
  },

  async checkout(organizationId: string, input: ToolCheckoutInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const tool = await tx.tool.findFirstOrThrow({ where: { id: input.toolId, organizationId } });
      if (tool.status !== ToolStatus.AVAILABLE) {
        throw new Error("TOOL_NOT_AVAILABLE");
      }

      const active = await tx.toolCheckout.findFirst({
        where: { toolId: input.toolId, returnedAt: null },
      });
      if (active) throw new Error("TOOL_ALREADY_CHECKED_OUT");

      const checkout = await tx.toolCheckout.create({
        data: {
          toolId: input.toolId,
          checkedOutById: userId,
          serviceOrderId: input.serviceOrderId,
          notes: input.notes,
        },
        include: { checkedOutBy: true, tool: true },
      });

      await tx.tool.update({
        where: { id: input.toolId },
        data: { status: ToolStatus.IN_USE },
      });

      return checkout;
    });
  },

  async returnTool(organizationId: string, checkoutId: string, notes?: string) {
    return prisma.$transaction(async (tx) => {
      const checkout = await tx.toolCheckout.findFirstOrThrow({
        where: { id: checkoutId, tool: { organizationId } },
      });
      if (checkout.returnedAt) throw new Error("ALREADY_RETURNED");

      const updated = await tx.toolCheckout.update({
        where: { id: checkoutId },
        data: { returnedAt: new Date(), notes: notes ?? checkout.notes },
      });

      await tx.tool.update({
        where: { id: checkout.toolId },
        data: { status: ToolStatus.AVAILABLE },
      });

      return updated;
    });
  },

  async scheduleMaintenance(
    organizationId: string,
    data: {
      toolId: string;
      scheduledAt: Date;
      description: string;
      cost?: number;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.tool.findFirstOrThrow({ where: { id: data.toolId, organizationId } });
      await tx.tool.update({
        where: { id: data.toolId },
        data: { status: ToolStatus.MAINTENANCE },
      });
      return tx.toolMaintenance.create({ data });
    });
  },

  async toolsInUse(organizationId: string) {
    return prisma.toolCheckout.findMany({
      where: { returnedAt: null, tool: { organizationId } },
      include: {
        tool: true,
        checkedOutBy: { select: { fullName: true, id: true } },
        serviceOrder: { select: { orderNumber: true, id: true } },
      },
    });
  },
};
