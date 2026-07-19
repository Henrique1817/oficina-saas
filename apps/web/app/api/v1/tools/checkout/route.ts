import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, toolCheckoutSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { toolRepository } from "@/server/modules/tools/tool.repository";

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, toolCheckoutSchema);
  if ("error" in parsed) return parsed.error;
  try {
    const checkout = await toolRepository.checkout(ctx.organizationId, parsed.data, ctx.userId);
    return apiSuccess(checkout, 201);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "TOOL_NOT_AVAILABLE") return apiError("Tool not available", 409);
      if (e.message === "TOOL_ALREADY_CHECKED_OUT") return apiError("Tool already checked out", 409);
    }
    throw e;
  }
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });
