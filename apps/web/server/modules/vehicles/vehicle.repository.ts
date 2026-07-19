import { prisma } from "@oficina/database";
import type { CreateVehicleInput, CreateVehicleVariantInput, UpdateVehicleInput } from "@oficina/shared";

export const vehicleRepository = {
  async listVariants(organizationId: string, q?: string) {
    return prisma.vehicleVariant.findMany({
      where: {
        organizationId,
        ...(q
          ? {
              OR: [
                { make: { contains: q, mode: "insensitive" } },
                { model: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ make: "asc" }, { model: "asc" }],
      take: 50,
    });
  },

  async createVariant(organizationId: string, input: CreateVehicleVariantInput) {
    return prisma.vehicleVariant.create({ data: { ...input, organizationId } });
  },

  async listByCustomer(organizationId: string, customerId: string) {
    return prisma.vehicle.findMany({
      where: { organizationId, customerId },
      include: { variant: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getByPlate(organizationId: string, plate: string) {
    return prisma.vehicle.findFirst({
      where: { organizationId, plate: plate.toUpperCase() },
      include: { customer: true, variant: true },
    });
  },

  async create(organizationId: string, input: CreateVehicleInput) {
    return prisma.vehicle.create({
      data: { ...input, organizationId, plate: input.plate.toUpperCase() },
      include: { variant: true, customer: true },
    });
  },

  async update(organizationId: string, id: string, input: UpdateVehicleInput) {
    const existing = await prisma.vehicle.findFirst({ where: { id, organizationId } });
    if (!existing) throw new Error("NOT_FOUND");
    return prisma.vehicle.update({
      where: { id },
      data: {
        ...input,
        ...(input.plate ? { plate: input.plate.toUpperCase() } : {}),
      },
      include: { variant: true },
    });
  },
};
