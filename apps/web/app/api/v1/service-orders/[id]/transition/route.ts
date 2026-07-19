import { withAuth, requireMechanicOwnsOrder } from "@oficina/auth";
import { apiError, apiSuccess, transitionServiceOrderSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import {
  serviceOrderRepository,
  ServiceOrderInventoryError,
} from "@/server/modules/service-orders/service-order.repository";

function getId(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.indexOf("service-orders") + 1]!;
}

export const POST = withAuth(async (ctx, request) => {
  const order = await serviceOrderRepository.getById(ctx.organizationId, getId(request));
  if (!order) return apiError("Service order not found", 404);

  const parsed = await parseJson(request, transitionServiceOrderSchema);
  if ("error" in parsed) return parsed.error;

  if (ctx.role === "MECHANIC") {
    if (!requireMechanicOwnsOrder(ctx, order.assignedMechanicId)) {
      return apiError("Forbidden", 403);
    }
    const mechanicAllowed = ["IN_PROGRESS", "DONE"];
    if (!mechanicAllowed.includes(parsed.data.status)) {
      return apiError("Mechanics can only start or complete work", 403);
    }
  }

  try {
    const updated = await serviceOrderRepository.transition(
      ctx.organizationId,
      getId(request),
      parsed.data,
      ctx.userId,
      ctx.role,
    );
    return apiSuccess(updated);
  } catch (e) {
    if (e instanceof ServiceOrderInventoryError && e.code === "INSUFFICIENT_STOCK") {
      return apiError("Estoque insuficiente para concluir a OS", 409);
    }
    if (e instanceof Error) {
      if (e.message === "INVALID_TRANSITION") return apiError("Invalid status transition", 400);
      if (e.message === "MECHANIC_CANNOT_CANCEL_IN_PROGRESS") {
        return apiError("Only managers can cancel in-progress orders", 403);
      }
    }
    throw e;
  }
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });
