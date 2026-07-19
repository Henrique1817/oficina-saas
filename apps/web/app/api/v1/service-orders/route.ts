import { withAuth } from "@oficina/auth";
import { apiSuccess, createServiceOrderSchema, serviceOrderQuerySchema } from "@oficina/shared";
import { parseJson, parseSearchParams } from "@/server/lib/parse";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";

export const GET = withAuth(async (ctx, request) => {
  const parsed = parseSearchParams(request.url, serviceOrderQuerySchema);
  if ("error" in parsed) return parsed.error;

  const params = { ...parsed.data };
  if (ctx.role === "MECHANIC") {
    params.mechanicId = ctx.userId;
  }

  const result = await serviceOrderRepository.list(ctx.organizationId, params);
  return apiSuccess(result);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, createServiceOrderSchema);
  if ("error" in parsed) return parsed.error;
  const order = await serviceOrderRepository.create(ctx.organizationId, parsed.data, ctx.userId);
  return apiSuccess(order, 201);
}, { roles: ["ADMIN", "MANAGER"] });
