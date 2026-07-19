import { ORG_COOKIE, withUserAuth } from "@oficina/auth";
import { apiError, apiSuccess, acceptInviteSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { inviteRepository } from "@/server/modules/users/invite.repository";

export const POST = withUserAuth(async (ctx, request) => {
  const parsed = await parseJson(request, acceptInviteSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const membership = await inviteRepository.accept(parsed.data.token, {
      id: ctx.userId,
      email: ctx.email,
    });

    const response = apiSuccess({
      organizationId: membership.organizationId,
      organizationSlug: membership.organization.slug,
      role: membership.role,
    });

    response.headers.append(
      "Set-Cookie",
      `${ORG_COOKIE}=${membership.organization.slug}; Path=/; HttpOnly; SameSite=Lax`,
    );
    return response;
  } catch (e) {
    if (e instanceof Error) {
      const map: Record<string, { message: string; status: number }> = {
        INVITE_NOT_FOUND: { message: "Convite não encontrado", status: 404 },
        INVITE_ALREADY_USED: { message: "Convite já utilizado", status: 400 },
        INVITE_EXPIRED: { message: "Convite expirado", status: 400 },
        INVITE_EMAIL_MISMATCH: {
          message: "Este convite é para outro e-mail. Entre com a conta convidada.",
          status: 403,
        },
      };
      const hit = map[e.message];
      if (hit) return apiError(hit.message, hit.status);
    }
    throw e;
  }
});
