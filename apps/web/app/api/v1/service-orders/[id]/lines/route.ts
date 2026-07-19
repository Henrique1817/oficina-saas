import { withAuth, requireMechanicOwnsOrder } from "@oficina/auth";
import { apiError, apiSuccess, serviceOrderLineSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import {
  serviceOrderRepository,
  ServiceOrderInventoryError,
} from "@/server/modules/service-orders/service-order.repository";

function getId(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.indexOf("service-orders") + 1]!;
}

const LINE_EDIT_STATUSES = ["DRAFT", "APPROVED", "IN_PROGRESS"] as const;

export const POST = withAuth(async (ctx, request) => {
  const order = await serviceOrderRepository.getById(ctx.organizationId, getId(request));
  if (!order) return apiError("Service order not found", 404);

  if (!requireMechanicOwnsOrder(ctx, order.assignedMechanicId) && ctx.role === "MECHANIC") {
    return apiError("Forbidden", 403);
  }

  if (!LINE_EDIT_STATUSES.includes(order.status as (typeof LINE_EDIT_STATUSES)[number])) {
    return apiError("Cannot add lines to order in current status", 400);
  }

  const parsed = await parseJson(request, serviceOrderLineSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const updated = await serviceOrderRepository.addLine(
      ctx.organizationId,
      getId(request),
      parsed.data,
      ctx.userId,
    );
    return apiSuccess(updated, 201);
  } catch (e) {
    if (e instanceof ServiceOrderInventoryError && e.code === "INSUFFICIENT_STOCK") {
      return apiError("Estoque insuficiente para esta peça", 409);
    }
    if (e instanceof Error) {
      if (e.message === "QUOTE_LOCKED") {
        return apiError("Orçamento já enviado; reprove para editar itens", 400);
      }
      if (e.message === "LINES_ONLY_DRAFT") {
        return apiError("Só é possível adicionar itens em OS rascunho", 400);
      }
    }
    throw e;
  }
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });
