import { withAuth } from "@oficina/auth";
import { apiSuccess, createToolSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { toolRepository } from "@/server/modules/tools/tool.repository";

export const GET = withAuth(async (ctx) => {
  const tools = await toolRepository.list(ctx.organizationId);
  return apiSuccess(tools);
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

export const POST = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, createToolSchema);
  if ("error" in parsed) return parsed.error;
  const tool = await toolRepository.create(ctx.organizationId, parsed.data);
  return apiSuccess(tool, 201);
}, { roles: ["ADMIN", "MANAGER"] });
