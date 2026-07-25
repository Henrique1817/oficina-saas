import { withAuth } from "@oficina/auth";
import { apiSuccess, createInviteSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { inviteRepository } from "@/server/modules/users/invite.repository";
import { sendInviteEmail } from "@/server/modules/email/send";
import { prisma } from "@oficina/database";

export const GET = withAuth(async (ctx) => {
  const invites = await inviteRepository.listPending(ctx.organizationId);
  return apiSuccess(invites);
}, { roles: ["ADMIN"] });

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, createInviteSchema);
  if ("error" in parsed) return parsed.error;

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

  const mail = await sendInviteEmail({
    to: invite.email,
    organizationName: org?.name ?? "Oficina",
    acceptUrl,
    role: invite.role,
  });

  return apiSuccess(
    {
      ...invite,
      acceptUrl,
      emailSent: mail.sent,
    },
    201,
  );
}, { roles: ["ADMIN"] });
