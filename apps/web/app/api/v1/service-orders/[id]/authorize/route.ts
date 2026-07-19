import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, authorizeServiceOrderSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";

function getId(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.indexOf("service-orders") + 1]!;
}

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, authorizeServiceOrderSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const updated = await serviceOrderRepository.authorizeWork(
      ctx.organizationId,
      getId(request),
      parsed.data,
      ctx.userId,
    );
    return apiSuccess(updated);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "ORDER_CANCELLED") {
        return apiError("Não é possível autorizar OS cancelada", 400, e.message);
      }
      if (e.message === "AUTHORIZE_EMPTY") {
        return apiError(
          "Adicione peças, serviços ou mão de obra antes de autorizar",
          400,
          e.message,
        );
      }
    }
    throw e;
  }
}, { roles: ["ADMIN", "MANAGER"] });
