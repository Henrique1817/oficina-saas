import { apiError, apiSuccess, upsertPipelineRunSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { authorizePipelineIngest } from "@/server/modules/platform/pipeline-auth";
import { pipelineRepository } from "@/server/modules/platform/pipeline.repository";

export async function POST(request: Request) {
  if (!authorizePipelineIngest(request)) {
    return apiError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const parsed = await parseJson(request, upsertPipelineRunSchema);
  if ("error" in parsed) return parsed.error;

  const run = await pipelineRepository.upsertRun(parsed.data);
  return apiSuccess(run, 201);
}
