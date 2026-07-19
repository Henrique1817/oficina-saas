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
  const updated = await serviceOrderRepository.addLabor(ctx.organizationId, getId(request), parsed.data);
  return apiSuccess(updated, 201);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });
