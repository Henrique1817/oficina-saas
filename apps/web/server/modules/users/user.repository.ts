import { prisma, type UserRole } from "@oficina/database";

export const userRepository = {
  async list(organizationId: string) {
    const memberships = await prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            active: true,
            createdAt: true,
          },
        },
      },
      orderBy: { user: { fullName: "asc" } },
    });

    return memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      fullName: m.user.fullName,
      role: m.role,
      active: m.active && m.user.active,
      createdAt: m.user.createdAt,
    }));
  },

  async getById(organizationId: string, userId: string) {
    const membership = await prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: { user: true },
    });
    if (!membership) return null;
    return {
      ...membership.user,
      role: membership.role,
      active: membership.active && membership.user.active,
    };
  },

  async updateRole(organizationId: string, userId: string, role: UserRole) {
    const membership = await prisma.membership.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { role },
      include: { user: true },
    });
    return {
      ...membership.user,
      role: membership.role,
      active: membership.active && membership.user.active,
    };
  },

  async updateProfile(organizationId: string, userId: string, data: { fullName?: string; active?: boolean }) {
    const membership = await prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership) throw new Error("NOT_FOUND");
    return prisma.profile.update({ where: { id: userId }, data });
  },

  async getDashboardStats(organizationId: string) {
    const [openOrders, lowStockParts, toolsInUse, customers] = await Promise.all([
      prisma.serviceOrder.count({
        where: {
          organizationId,
          status: { in: ["DRAFT", "APPROVED", "IN_PROGRESS"] },
        },
      }),
      prisma.part.findMany({
        where: { organizationId, active: true },
        include: { stockItems: true },
      }),
      prisma.toolCheckout.count({
        where: { returnedAt: null, tool: { organizationId } },
      }),
      prisma.customer.count({ where: { organizationId } }),
    ]);

    const lowStock = lowStockParts.filter((p) => {
      const available = p.stockItems.reduce((s, i) => s + i.quantity - i.reservedQty, 0);
      return available <= p.minQuantity;
    }).length;

    return { openOrders, lowStock, toolsInUse, customers };
  },
};
