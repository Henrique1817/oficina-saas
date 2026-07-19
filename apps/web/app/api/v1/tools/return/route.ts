import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, toolReturnSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { toolRepository } from "@/server/modules/tools/tool.repository";

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, toolReturnSchema);
  if ("error" in parsed) return parsed.error;
  try {
    const result = await toolRepository.returnTool(ctx.organizationId, parsed.data.checkoutId, parsed.data.notes);
    return apiSuccess(result);
  } catch (e) {
    if (e instanceof Error && e.message === "ALREADY_RETURNED") {
      return apiError("Tool already returned", 409);
    }
    throw e;
  }
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });
