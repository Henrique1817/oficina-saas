import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, stockMovementSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { inventoryRepository } from "@/server/modules/inventory/inventory.repository";

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, stockMovementSchema);
  if ("error" in parsed) return parsed.error;
  try {
    const movement = await inventoryRepository.applyMovement(ctx.organizationId, parsed.data, ctx.userId);
    return apiSuccess(movement, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT_STOCK") {
      return apiError("Insufficient stock", 409, "INSUFFICIENT_STOCK");
    }
    throw e;
  }
}, { roles: ["ADMIN", "MANAGER"] });
