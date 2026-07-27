import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, createInviteSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { inviteRepository } from "@/server/modules/users/invite.repository";
import { sendInviteMagicEmail } from "@/server/modules/email/invite-magic";
import { prisma, type UserRole } from "@oficina/database";

function inviteConflictMessage(code: string): { message: string; status: number; apiCode: string } | null {
  if (code.startsWith("ALREADY_MEMBER:")) {
    const role = code.split(":")[1] as UserRole;
    const label = inviteRepository.roleLabel(role);
    return {
      message: `Este e-mail já faz parte da oficina como ${label}. Um e-mail só pode ter um papel (Admin, Gerente ou Mecânico).`,
      status: 409,
      apiCode: "ALREADY_MEMBER",
    };
  }
  if (code.startsWith("INVITE_PENDING:")) {
    const role = code.split(":")[1] as UserRole;
    const label = inviteRepository.roleLabel(role);
    return {
      message: `Já existe um convite pendente para este e-mail (${label}). Cancele ou aguarde o aceite antes de convidar de novo.`,
      status: 409,
      apiCode: "INVITE_PENDING",
    };
  }
  return null;
}

export const GET = withAuth(async (ctx) => {
  const invites = await inviteRepository.listPending(ctx.organizationId);
  return apiSuccess(invites);
}, { roles: ["ADMIN"] });

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, createInviteSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const invite = await inviteRepository.create({
      organizationId: ctx.organizationId,
      email: parsed.data.email,
      role: parsed.data.role,
      invitedById: ctx.userId,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const acceptUrl = `${appUrl}/invite/${invite.token}`;

    const org = await prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: { name: true },
    });

    const inviter = await prisma.profile.findUnique({
      where: { id: ctx.userId },
      select: { fullName: true },
    });

    const mail = await sendInviteMagicEmail({
      to: invite.email,
      organizationName: org?.name ?? "Oficina",
      role: invite.role,
      inviteToken: invite.token,
      invitedByName: inviter?.fullName,
    });

    if (!mail.sent) {
      console.warn("[invites] e-mail não enviado", {
        email: invite.email,
        channel: mail.channel,
        error: mail.error,
      });
    }

    return apiSuccess(
      {
        ...invite,
        acceptUrl,
        emailSent: mail.sent,
        emailChannel: mail.channel,
      },
      201,
    );
  } catch (e) {
    if (e instanceof Error) {
      const conflict = inviteConflictMessage(e.message);
      if (conflict) {
        return apiError(conflict.message, conflict.status, conflict.apiCode);
      }
    }
    throw e;
  }
}, { roles: ["ADMIN"] });
