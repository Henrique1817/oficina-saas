import { apiSuccess, upsertPipelineRunSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { assertPipelineIngestAuth } from "@/server/lib/pipeline-auth";
import { pipelineRepository } from "@/server/modules/platform/pipeline.repository";

export async function POST(request: Request) {
  const denied = assertPipelineIngestAuth(request);
  if (denied) return denied;

  const parsed = await parseJson(request, upsertPipelineRunSchema);
  if ("error" in parsed) return parsed.error;

  const run = await pipelineRepository.upsertRun(parsed.data);
  return apiSuccess(run, 201);
}
