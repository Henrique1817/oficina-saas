import { inventoryRepository } from "@/server/modules/inventory/inventory.repository";
import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, stockMovementSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";

const MANUAL_TYPES = new Set(["IN", "OUT", "ADJUSTMENT"]);

export const POST = withAuth(
  async (ctx, request) => {
    const parsed = await parseJson(request, stockMovementSchema);
    if ("error" in parsed) return parsed.error;

    if (!MANUAL_TYPES.has(parsed.data.type)) {
      return apiError("Tipo de movimento não permitido nesta rota", 400, "INVALID_MOVEMENT_TYPE");
    }

    if (parsed.data.type === "ADJUSTMENT" && ctx.role === "MECHANIC") {
      return apiError("Ajuste de estoque requer gerente ou admin", 403, "FORBIDDEN");
    }

    try {
      const movement = await inventoryRepository.applyMovement(
        ctx.organizationId,
        parsed.data,
        ctx.userId,
      );
      return apiSuccess(movement, 201);
    } catch (e) {
      if (e instanceof Error && e.message === "INSUFFICIENT_STOCK") {
        return apiError("Estoque insuficiente", 409, "INSUFFICIENT_STOCK");
      }
      if (e instanceof Error && e.message === "PART_NOT_FOUND") {
        return apiError("Peça não encontrada", 404, "PART_NOT_FOUND");
      }
      if (e instanceof Error && e.message === "LOCATION_NOT_FOUND") {
        return apiError("Local não encontrado", 404, "LOCATION_NOT_FOUND");
      }
      throw e;
    }
  },
  { roles: ["ADMIN", "MANAGER", "MECHANIC"] },
);
