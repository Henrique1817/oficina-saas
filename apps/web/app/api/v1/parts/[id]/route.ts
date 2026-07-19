import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, updatePartSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { inventoryRepository } from "@/server/modules/inventory/inventory.repository";

function getId(request: Request) {
  return new URL(request.url).pathname.split("/").pop()!;
}

export const GET = withAuth(async (ctx, request) => {
  const part = await inventoryRepository.getPart(ctx.organizationId, getId(request));
  if (!part) return apiError("Part not found", 404);
  return apiSuccess(part);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

export const PATCH = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, updatePartSchema);
  if ("error" in parsed) return parsed.error;

  const part = await inventoryRepository.updatePart(
    ctx.organizationId,
    getId(request),
    parsed.data,
  );
  if (!part) return apiError("Part not found", 404);
  return apiSuccess(part);
}, { roles: ["ADMIN", "MANAGER"] });
