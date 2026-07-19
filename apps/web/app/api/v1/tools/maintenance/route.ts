import { withAuth } from "@oficina/auth";
import { apiSuccess, toolMaintenanceSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { toolRepository } from "@/server/modules/tools/tool.repository";

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, toolMaintenanceSchema);
  if ("error" in parsed) return parsed.error;
  const maintenance = await toolRepository.scheduleMaintenance(ctx.organizationId, parsed.data);
  return apiSuccess(maintenance, 201);
}, { roles: ["ADMIN", "MANAGER"] });
