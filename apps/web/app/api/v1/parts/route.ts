import { withAuth } from "@oficina/auth";
import { apiSuccess, createPartSchema, partQuerySchema } from "@oficina/shared";
import { parseJson, parseSearchParams } from "@/server/lib/parse";
import { inventoryRepository } from "@/server/modules/inventory/inventory.repository";

export const GET = withAuth(async (ctx, request) => {
  const parsed = parseSearchParams(request.url, partQuerySchema);
  if ("error" in parsed) return parsed.error;
  const result = await inventoryRepository.listParts(ctx.organizationId, parsed.data);
  return apiSuccess(result);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, createPartSchema);
  if ("error" in parsed) return parsed.error;
  const part = await inventoryRepository.createPart(ctx.organizationId, parsed.data);
  return apiSuccess(part, 201);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });
