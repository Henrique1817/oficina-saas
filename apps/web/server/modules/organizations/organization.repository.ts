import { prisma, type PlanStatus } from "@oficina/database";
import { BILLING_TRIAL_DAYS } from "@/server/modules/billing/config";

function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "oficina";
}

export async function uniqueOrgSlug(name: string): Promise<string> {
  const base = slugify(name);
  for (let i = 0; i < 8; i++) {
    const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const exists = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export const organizationRepository = {
  async createWithOwner(input: {
    name: string;
    ownerUserId: string;
    ownerEmail: string;
  }) {
    const slug = await uniqueOrgSlug(input.name);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + BILLING_TRIAL_DAYS);

    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.name.trim(),
          slug,
          planStatus: "TRIALING",
          trialEndsAt,
        },
      });

      await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: input.ownerUserId,
          role: "ADMIN",
          active: true,
        },
      });

      await tx.stockLocation.create({
        data: {
          organizationId: organization.id,
          name: "Oficina Principal",
          description: "Estoque geral",
        },
      });

      // Espelha papel legado no profile do dono
      await tx.profile.update({
        where: { id: input.ownerUserId },
        data: { role: "ADMIN", email: input.ownerEmail },
      });

      return organization;
    });
  },

  async updateBilling(
    organizationId: string,
    data: {
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      planStatus?: PlanStatus;
      trialEndsAt?: Date | null;
      pastDueAt?: Date | null;
    },
  ) {
    return prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  },

  async findByStripeCustomerId(stripeCustomerId: string) {
    return prisma.organization.findUnique({ where: { stripeCustomerId } });
  },

  async findById(id: string) {
    return prisma.organization.findUnique({ where: { id } });
  },

  async updateBranding(
    organizationId: string,
    data: {
      name?: string;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      quoteValidityDays?: number;
      whatsappTemplates?: unknown;
    },
  ) {
    return prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.email !== undefined ? { email: data.email || null } : {}),
        ...(data.address !== undefined ? { address: data.address || null } : {}),
        ...(data.quoteValidityDays !== undefined
          ? { quoteValidityDays: data.quoteValidityDays }
          : {}),
        ...(data.whatsappTemplates !== undefined
          ? { whatsappTemplates: data.whatsappTemplates as object }
          : {}),
      },
    });
  },
};
