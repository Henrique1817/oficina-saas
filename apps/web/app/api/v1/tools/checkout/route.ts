import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, toolCheckoutSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { toolRepository } from "@/server/modules/tools/tool.repository";

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, toolCheckoutSchema);
  if ("error" in parsed) return parsed.error;
  try {
    const checkout = await toolRepository.checkout(ctx.organizationId, parsed.data, ctx.userId);
    return apiSuccess(checkout, 201);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "TOOL_NOT_AVAILABLE") return apiError("Ferramenta indisponível", 409, e.message);
      if (e.message === "TOOL_ALREADY_CHECKED_OUT") {
        return apiError("Ferramenta já está em uso", 409, e.message);
      }
      if (e.message === "SERVICE_ORDER_NOT_FOUND") {
        return apiError("Ordem de serviço não encontrada", 404, e.message);
      }
      if (e.message === "SERVICE_ORDER_NOT_ACTIVE") {
        return apiError(
          "Ferramenta só pode ser vinculada a OS aprovada ou em andamento",
          400,
          e.message,
        );
      }
    }
    throw e;
  }
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });
