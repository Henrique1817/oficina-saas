import {
  prisma,
  ServiceOrderStatus,
  type Prisma,
} from "@oficina/database";
import type {
  AuthorizeServiceOrderInput,
  CreateServiceOrderInput,
  ServiceOrderLaborInput,
  ServiceOrderLineInput,
  TransitionServiceOrderInput,
  UpdateServiceOrderInput,
} from "@oficina/shared";
import {
  consumePartsForOrder,
  getDefaultLocationId,
  releaseAllReservationsForOrder,
  ServiceOrderInventoryError,
} from "./service-order-inventory";
import { OPEN_ORDER_STATUSES, saoPauloDayRange, WORK_ORDER_STATUSES } from "./agenda";

export { ServiceOrderInventoryError };

const agendaInclude = {
  customer: { select: { name: true } },
  vehicle: { select: { plate: true, vehicleModel: true } },
  assignedMechanic: { select: { id: true, fullName: true } },
} as const;

const VALID_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  DRAFT: ["APPROVED", "CANCELLED"],
  APPROVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["DONE", "CANCELLED"],
  DONE: ["INVOICED"],
  INVOICED: [],
  CANCELLED: [],
};

async function nextOrderNumber(organizationId: string): Promise<number> {
  const result = await prisma.serviceOrder.aggregate({
    where: { organizationId },
    _max: { orderNumber: true },
  });
  return (result._max.orderNumber ?? 0) + 1;
}

export const serviceOrderRepository = {
  async list(
    organizationId: string,
    params: {
      status?: ServiceOrderStatus;
      mechanicId?: string;
      customerId?: string;
      due?: "today" | "overdue";
      cursor?: string;
      limit: number;
    },
  ) {
    const where: Prisma.ServiceOrderWhereInput = { organizationId };
    if (params.status) where.status = params.status;
    if (params.mechanicId) where.assignedMechanicId = params.mechanicId;
    if (params.customerId) where.customerId = params.customerId;

    if (params.due === "today") {
      const { start, end } = saoPauloDayRange();
      where.status = { in: [...OPEN_ORDER_STATUSES] };
      where.dueAt = { gte: start, lte: end };
    } else if (params.due === "overdue") {
      where.status = { in: [...OPEN_ORDER_STATUSES] };
      where.dueAt = { lt: new Date() };
    }

    const items = await prisma.serviceOrder.findMany({
      where,
      take: params.limit + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      orderBy: params.due ? { dueAt: "asc" } : { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        vehicle: { select: { plate: true, vehicleModel: true, vehicleYear: true } },
        assignedMechanic: { select: { fullName: true } },
      },
    });

    const hasMore = items.length > params.limit;
    const data = hasMore ? items.slice(0, -1) : items;
    return { data, nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null, hasMore };
  },

  /** Agenda operacional do dia: prazos, atrasos e quadro por mecânico. */
  async getAgenda(organizationId: string, opts?: { mechanicId?: string }) {
    const now = new Date();
    const { start, end, ymd } = saoPauloDayRange(now);
    const mechanicFilter = opts?.mechanicId
      ? { assignedMechanicId: opts.mechanicId }
      : {};

    const openBase: Prisma.ServiceOrderWhereInput = {
      organizationId,
      status: { in: [...OPEN_ORDER_STATUSES] },
      ...mechanicFilter,
    };

    const [dueToday, overdue, inProgressBoard] = await Promise.all([
      prisma.serviceOrder.findMany({
        where: {
          ...openBase,
          dueAt: { gte: start, lte: end },
        },
        orderBy: { dueAt: "asc" },
        take: 40,
        include: agendaInclude,
      }),
      prisma.serviceOrder.findMany({
        where: {
          ...openBase,
          dueAt: { lt: now },
        },
        orderBy: { dueAt: "asc" },
        take: 40,
        include: agendaInclude,
      }),
      prisma.serviceOrder.findMany({
        where: {
          organizationId,
          status: { in: [...WORK_ORDER_STATUSES] },
          ...mechanicFilter,
        },
        orderBy: [{ dueAt: "asc" }, { openedAt: "asc" }],
        take: 60,
        include: agendaInclude,
      }),
    ]);

    type BoardOrder = (typeof inProgressBoard)[number];
    const byMechanicMap = new Map<
      string,
      { mechanicId: string | null; mechanicName: string; orders: BoardOrder[] }
    >();

    for (const order of inProgressBoard) {
      const key = order.assignedMechanicId ?? "unassigned";
      const name = order.assignedMechanic?.fullName ?? "Sem mecânico";
      if (!byMechanicMap.has(key)) {
        byMechanicMap.set(key, {
          mechanicId: order.assignedMechanicId,
          mechanicName: name,
          orders: [],
        });
      }
      byMechanicMap.get(key)!.orders.push(order);
    }

    const byMechanic = [...byMechanicMap.values()].sort((a, b) => {
      if (a.mechanicId === null) return 1;
      if (b.mechanicId === null) return -1;
      return a.mechanicName.localeCompare(b.mechanicName, "pt-BR");
    });

    return {
      day: ymd,
      counts: {
        dueToday: dueToday.length,
        overdue: overdue.length,
        inProgress: inProgressBoard.length,
      },
      dueToday,
      overdue,
      byMechanic,
    };
  },

  async getById(organizationId: string, id: string) {
    return prisma.serviceOrder.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        vehicle: { include: { variant: true } },
        assignedMechanic: true,
        lines: { include: { part: true } },
        laborEntries: { include: { mechanic: { select: { fullName: true, id: true } } } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 20 },
        toolCheckouts: {
          where: { returnedAt: null },
          include: {
            tool: { select: { id: true, name: true, assetCode: true } },
            checkedOutBy: { select: { id: true, fullName: true } },
          },
        },
      },
    });
  },

  async create(organizationId: string, input: CreateServiceOrderInput, createdById: string) {
    const orderNumber = await nextOrderNumber(organizationId);
    const { assignedMechanicId, dueAt, ...rest } = input;
    return prisma.serviceOrder.create({
      data: {
        ...rest,
        assignedMechanicId: assignedMechanicId ?? null,
        dueAt: dueAt ?? null,
        organizationId,
        orderNumber,
        statusHistory: {
          create: {
            toStatus: ServiceOrderStatus.DRAFT,
            changedById: createdById,
            notes: "OS criada",
          },
        },
      },
      include: { customer: true, vehicle: true },
    });
  },

  async update(organizationId: string, id: string, input: UpdateServiceOrderInput) {
    const existing = await prisma.serviceOrder.findFirst({ where: { id, organizationId } });
    if (!existing) throw new Error("NOT_FOUND");
    const { discount, ...rest } = input;
    const updated = await prisma.serviceOrder.update({
      where: { id },
      data: {
        ...rest,
        ...(discount !== undefined ? { discount } : {}),
      },
    });
    if (discount !== undefined) {
      await recalculateTotals(id);
      return this.getById(organizationId, id);
    }
    return updated;
  },

  async authorizeWork(
    organizationId: string,
    id: string,
    input: AuthorizeServiceOrderInput,
    userId: string,
  ) {
    const order = await prisma.serviceOrder.findFirstOrThrow({
      where: { id, organizationId },
      include: { lines: true, laborEntries: true },
    });
    if (order.status === "CANCELLED") throw new Error("ORDER_CANCELLED");
    if (order.lines.length === 0 && order.laborEntries.length === 0) {
      throw new Error("AUTHORIZE_EMPTY");
    }

    return prisma.serviceOrder.update({
      where: { id },
      data: {
        workAuthorizedAt: new Date(),
        workAuthorizedBy: input.signedBy.trim(),
        workAuthorizedNotes: input.notes?.trim() || null,
        workAuthorizedMethod: input.method,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: order.status,
            changedById: userId,
            notes: `Serviço autorizado por ${input.signedBy.trim()} (${input.method})`,
          },
        },
      },
      include: {
        customer: true,
        vehicle: true,
        assignedMechanic: true,
      },
    });
  },

  async addLine(
    organizationId: string,
    serviceOrderId: string,
    line: ServiceOrderLineInput,
    userId: string,
  ) {
    const existing = await prisma.serviceOrder.findFirstOrThrow({
      where: { id: serviceOrderId, organizationId },
    });
    if (existing.status !== "DRAFT") throw new Error("LINES_ONLY_DRAFT");
    if (existing.quoteSentAt) throw new Error("QUOTE_LOCKED");

    const total = line.quantity * line.unitPrice;

    const order = await prisma.$transaction(async (tx) => {
      if (line.type === "PART" && line.partId) {
        const locationId = await getDefaultLocationId(organizationId, tx);
        const qty = Math.ceil(line.quantity);
        const stock = await tx.stockItem.findUnique({
          where: { partId_locationId: { partId: line.partId!, locationId } },
        });
        const available = (stock?.quantity ?? 0) - (stock?.reservedQty ?? 0);
        if (available < qty) {
          throw new ServiceOrderInventoryError("Insufficient stock", "INSUFFICIENT_STOCK", line.partId);
        }
        await tx.stockItem.upsert({
          where: { partId_locationId: { partId: line.partId!, locationId } },
          create: { partId: line.partId!, locationId, quantity: 0, reservedQty: qty },
          update: { reservedQty: { increment: qty } },
        });
        await tx.inventoryMovement.create({
          data: {
            organizationId,
            partId: line.partId!,
            locationId,
            type: "OS_RESERVATION",
            quantity: qty,
            serviceOrderId,
            createdById: userId,
            reference: `OS-reserve-${serviceOrderId}`,
          },
        });
      }

      return tx.serviceOrder.update({
        where: { id: serviceOrderId },
        data: { lines: { create: { ...line, total } } },
        include: { lines: { include: { part: true } } },
      });
    });

    await recalculateTotals(serviceOrderId);
    return order;
  },

  async addLabor(organizationId: string, serviceOrderId: string, labor: ServiceOrderLaborInput) {
    const existing = await prisma.serviceOrder.findFirstOrThrow({
      where: { id: serviceOrderId, organizationId },
    });
    if (existing.status !== "DRAFT") throw new Error("LABOR_ONLY_DRAFT");
    if (existing.quoteSentAt) throw new Error("QUOTE_LOCKED");
    const total = (labor.minutes / 60) * labor.hourlyRate;
    await prisma.serviceOrderLabor.create({
      data: { ...labor, serviceOrderId, total },
    });
    await recalculateTotals(serviceOrderId);
    return this.getById(organizationId, serviceOrderId);
  },

  async sendQuote(organizationId: string, id: string, userId: string) {
    const order = await prisma.serviceOrder.findFirstOrThrow({
      where: { id, organizationId },
      include: { lines: true, laborEntries: true },
    });
    if (order.status !== "DRAFT") throw new Error("QUOTE_ONLY_DRAFT");
    if (order.quoteSentAt) throw new Error("QUOTE_ALREADY_SENT");
    if (order.lines.length === 0 && order.laborEntries.length === 0) {
      throw new Error("QUOTE_EMPTY");
    }

    return prisma.serviceOrder.update({
      where: { id },
      data: {
        quoteSentAt: new Date(),
        quoteRejectedAt: null,
        quoteRejectionNotes: null,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: order.status,
            changedById: userId,
            notes: "Orçamento enviado ao cliente",
          },
        },
      },
    });
  },

  async approveQuote(organizationId: string, id: string, userId: string, notes?: string) {
    const order = await prisma.serviceOrder.findFirstOrThrow({ where: { id, organizationId } });
    if (order.status !== "DRAFT") throw new Error("QUOTE_ONLY_DRAFT");
    if (!order.quoteSentAt) throw new Error("QUOTE_NOT_SENT");

    await this.transition(
      organizationId,
      id,
      { status: "APPROVED", notes: notes ?? "Orçamento aprovado pelo cliente" },
      userId,
      "MANAGER",
    );

    return prisma.serviceOrder.update({
      where: { id },
      data: { quoteApprovedAt: new Date() },
    });
  },

  async rejectQuote(organizationId: string, id: string, userId: string, notes?: string) {
    const order = await prisma.serviceOrder.findFirstOrThrow({ where: { id, organizationId } });
    if (order.status !== "DRAFT") throw new Error("QUOTE_ONLY_DRAFT");
    if (!order.quoteSentAt) throw new Error("QUOTE_NOT_SENT");

    return prisma.serviceOrder.update({
      where: { id },
      data: {
        quoteSentAt: null,
        quoteRejectedAt: new Date(),
        quoteRejectionNotes: notes ?? null,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: order.status,
            changedById: userId,
            notes: notes ? `Orçamento reprovado: ${notes}` : "Orçamento reprovado",
          },
        },
      },
    });
  },

  async transition(
    organizationId: string,
    id: string,
    input: TransitionServiceOrderInput,
    userId: string,
    userRole: string,
  ) {
    const order = await prisma.serviceOrder.findFirstOrThrow({ where: { id, organizationId } });
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(input.status)) {
      throw new Error("INVALID_TRANSITION");
    }
    if (input.status === "CANCELLED" && order.status === "IN_PROGRESS" && userRole === "MECHANIC") {
      throw new Error("MECHANIC_CANNOT_CANCEL_IN_PROGRESS");
    }

    const timestamps: Prisma.ServiceOrderUpdateInput = {};
    if (input.status === "APPROVED") timestamps.approvedAt = new Date();
    if (input.status === "DONE") timestamps.completedAt = new Date();
    if (input.status === "INVOICED") timestamps.invoicedAt = new Date();

    if (input.status === "CANCELLED") {
      await releaseAllReservationsForOrder(organizationId, id, userId);
    }

    if (input.status === "DONE") {
      await consumePartsForOrder(organizationId, id, userId);
    }

    return prisma.serviceOrder.update({
      where: { id },
      data: {
        status: input.status,
        ...timestamps,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: input.status,
            changedById: userId,
            notes: input.notes,
          },
        },
      },
    });
  },
};

async function recalculateTotals(serviceOrderId: string) {
  const order = await prisma.serviceOrder.findUniqueOrThrow({
    where: { id: serviceOrderId },
    include: { lines: true, laborEntries: true },
  });

  const partsTotal = order.lines.reduce((s, l) => s + Number(l.total), 0);
  const laborTotal = order.laborEntries.reduce((s, l) => s + Number(l.total), 0);
  const total = partsTotal + laborTotal - Number(order.discount);

  await prisma.serviceOrder.update({
    where: { id: serviceOrderId },
    data: { partsTotal, laborTotal, total },
  });
}
