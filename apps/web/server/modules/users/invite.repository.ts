import { prisma, type UserRole } from "@oficina/database";

const INVITE_TTL_DAYS = 7;

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  MECHANIC: "Mecânico",
};

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

  /** Membership ativa na org para este e-mail (se o profile existir). */
  async findActiveMembershipByEmail(organizationId: string, email: string) {
    const normalized = email.trim().toLowerCase();
    const profile = await prisma.profile.findUnique({ where: { email: normalized } });
    if (!profile) return null;

    return prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: profile.id,
        },
      },
      include: { user: { select: { email: true, fullName: true } } },
    });
  },

  async findPendingInviteByEmail(organizationId: string, email: string) {
    const normalized = email.trim().toLowerCase();
    return prisma.organizationInvite.findFirst({
      where: {
        organizationId,
        email: normalized,
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

    const existingMember = await this.findActiveMembershipByEmail(
      input.organizationId,
      email,
    );
    if (existingMember?.active) {
      throw new Error(`ALREADY_MEMBER:${existingMember.role}`);
    }
    // Membership inativa: reativar só via novo convite aceito — ainda bloqueia 2º papel
    if (existingMember && !existingMember.active) {
      // permite reenviar convite (reativação), mas cancela pendentes do mesmo e-mail
    }

    const pending = await this.findPendingInviteByEmail(input.organizationId, email);
    if (pending) {
      throw new Error(`INVITE_PENDING:${pending.role}`);
    }

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

  /** Cancela convite pendente (só da própria org). */
  async cancel(inviteId: string, organizationId: string) {
    const invite = await prisma.organizationInvite.findFirst({
      where: {
        id: inviteId,
        organizationId,
        acceptedAt: null,
      },
    });
    if (!invite) throw new Error("INVITE_NOT_FOUND");
    if (invite.expiresAt < new Date()) throw new Error("INVITE_EXPIRED");

    await prisma.organizationInvite.delete({ where: { id: invite.id } });
    return { id: invite.id, email: invite.email };
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
      const existing = await tx.membership.findUnique({
        where: {
          organizationId_userId: {
            organizationId: invite.organizationId,
            userId: user.id,
          },
        },
      });

      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      // Invalida outros convites pendentes do mesmo e-mail nesta org
      await tx.organizationInvite.updateMany({
        where: {
          organizationId: invite.organizationId,
          email: invite.email,
          acceptedAt: null,
          id: { not: invite.id },
        },
        data: { acceptedAt: new Date() },
      });

      if (existing?.active) {
        // Já membro: não troca o papel (um e-mail = um papel na oficina)
        return tx.membership.findUniqueOrThrow({
          where: { id: existing.id },
          include: { organization: true },
        });
      }

      if (existing && !existing.active) {
        return tx.membership.update({
          where: { id: existing.id },
          data: { role: invite.role, active: true },
          include: { organization: true },
        });
      }

      return tx.membership.create({
        data: {
          organizationId: invite.organizationId,
          userId: user.id,
          role: invite.role,
          active: true,
        },
        include: { organization: true },
      });
    });
  },

  roleLabel(role: UserRole) {
    return ROLE_LABEL[role] ?? role;
  },
};
