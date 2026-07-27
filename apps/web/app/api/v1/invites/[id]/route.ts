import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess } from "@oficina/shared";
import { inviteRepository } from "@/server/modules/users/invite.repository";

function getId(request: Request) {
  return new URL(request.url).pathname.split("/").pop()!;
}

export const DELETE = withAuth(async (ctx, request) => {
  const id = getId(request);

  try {
    const cancelled = await inviteRepository.cancel(id, ctx.organizationId);
    return apiSuccess({ cancelled: true, ...cancelled });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "INVITE_NOT_FOUND") {
        return apiError("Convite não encontrado ou já usado", 404, "INVITE_NOT_FOUND");
      }
      if (e.message === "INVITE_EXPIRED") {
        return apiError("Este convite já expirou", 400, "INVITE_EXPIRED");
      }
    }
    throw e;
  }
}, { roles: ["ADMIN"] });
