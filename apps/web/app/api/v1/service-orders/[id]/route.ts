import { withAuth, requireMechanicOwnsOrder } from "@oficina/auth";
import { apiError, apiSuccess, updateServiceOrderSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";

function getId(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.indexOf("service-orders") + 1]!;
}

export const GET = withAuth(async (ctx, request) => {
  const order = await serviceOrderRepository.getById(ctx.organizationId, getId(request));
  if (!order) return apiError("Service order not found", 404);
  if (!requireMechanicOwnsOrder(ctx, order.assignedMechanicId)) {
    return apiError("Forbidden", 403);
  }
  return apiSuccess(order);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

export const PATCH = withAuth(async (ctx, request) => {
  const order = await serviceOrderRepository.getById(ctx.organizationId, getId(request));
  if (!order) return apiError("Service order not found", 404);
  if (!requireMechanicOwnsOrder(ctx, order.assignedMechanicId) && ctx.role === "MECHANIC") {
    return apiError("Forbidden", 403);
  }

  const parsed = await parseJson(request, updateServiceOrderSchema);
  if ("error" in parsed) return parsed.error;
  const updated = await serviceOrderRepository.update(ctx.organizationId, getId(request), parsed.data);
  return apiSuccess(updated);
}, { roles: ["ADMIN", "MANAGER"] });
