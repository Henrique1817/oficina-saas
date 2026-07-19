import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, serviceOrderLaborSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";

function getId(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.indexOf("service-orders") + 1]!;
}

export const POST = withAuth(async (ctx, request) => {
  const order = await serviceOrderRepository.getById(ctx.organizationId, getId(request));
  if (!order) return apiError("Service order not found", 404);

  const parsed = await parseJson(request, serviceOrderLaborSchema);
  if ("error" in parsed) return parsed.error;
  try {
    const updated = await serviceOrderRepository.addLabor(
      ctx.organizationId,
      getId(request),
      parsed.data,
    );
    return apiSuccess(updated, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "LABOR_ONLY_DRAFT") {
      return apiError("Mão de obra só pode ser adicionada em rascunho", 400, msg);
    }
    if (msg === "QUOTE_LOCKED") {
      return apiError("Orçamento enviado — edite após reprovar ou cancele o envio", 400, msg);
    }
    throw err;
  }
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });
