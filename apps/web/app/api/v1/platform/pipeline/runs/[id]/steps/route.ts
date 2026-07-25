import { apiError, apiSuccess, upsertPipelineStepSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { authorizePipelineIngest } from "@/server/modules/platform/pipeline-auth";
import { pipelineRepository } from "@/server/modules/platform/pipeline.repository";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  if (!authorizePipelineIngest(request)) {
    return apiError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { id } = await ctx.params;
  const parsed = await parseJson(request, upsertPipelineStepSchema);
  if ("error" in parsed) return parsed.error;

  const step = await pipelineRepository.upsertStep(id, parsed.data);
  if (!step) return apiError("Run not found", 404, "NOT_FOUND");
  return apiSuccess(step, 201);
}
