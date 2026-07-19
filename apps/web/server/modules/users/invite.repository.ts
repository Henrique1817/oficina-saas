import { prisma, type UserRole } from "@oficina/database";

const INVITE_TTL_DAYS = 7;

export const inviteRepository = {
  async listPending(organizationId: string) {
    return prisma.organizationInvite.findMany({
      where: {
        organizationId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(input: {
    organizationId: string;
    email: string;
    role: UserRole;
    invitedById: string;
  }) {
    const email = input.email.trim().toLowerCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

    return prisma.organizationInvite.create({
      data: {
        organizationId: input.organizationId,
        email,
        role: input.role,
        invitedById: input.invitedById,
        expiresAt,
      },
    });
  },

  async getByToken(token: string) {
    return prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });
  },

  async accept(token: string, user: { id: string; email: string }) {
    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: { organization: true },
    });
    if (!invite) throw new Error("INVITE_NOT_FOUND");
    if (invite.acceptedAt) throw new Error("INVITE_ALREADY_USED");
    if (invite.expiresAt < new Date()) throw new Error("INVITE_EXPIRED");
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error("INVITE_EMAIL_MISMATCH");
    }

    return prisma.$transaction(async (tx) => {
      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      const membership = await tx.membership.upsert({
        where: {
          organizationId_userId: {
            organizationId: invite.organizationId,
            userId: user.id,
          },
        },
        update: { role: invite.role, active: true },
        create: {
          organizationId: invite.organizationId,
          userId: user.id,
          role: invite.role,
          active: true,
        },
        include: { organization: true },
      });

      return membership;
    });
  },
};
