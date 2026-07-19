import { prisma } from "@oficina/database";
import { apiError, apiSuccess, upsertPipelineStepSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { assertPipelineIngestAuth } from "@/server/lib/pipeline-auth";
import { pipelineRepository } from "@/server/modules/platform/pipeline.repository";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const denied = assertPipelineIngestAuth(request);
  if (denied) return denied;

  const { id: pathId } = await ctx.params;
  const parsed = await parseJson(request, upsertPipelineStepSchema);
  if ("error" in parsed) return parsed.error;

  let runId: string | null = null;

  if (pathId === "by-external") {
    const provider = parsed.data.provider ?? "GITHUB_ACTIONS";
    const externalId = parsed.data.externalId;
    if (!externalId) {
      return apiError("externalId obrigatório", 400, "MISSING_EXTERNAL_ID");
    }
    const run = await pipelineRepository.findByExternal(provider, externalId);
    if (!run) return apiError("Run não encontrado", 404, "RUN_NOT_FOUND");
    runId = run.id;
  } else {
    const byId = await prisma.platformPipelineRun.findUnique({ where: { id: pathId } });
    if (byId) {
      runId = byId.id;
    } else {
      const byExt = await pipelineRepository.findByExternal("GITHUB_ACTIONS", pathId);
      if (!byExt) return apiError("Run não encontrado", 404, "RUN_NOT_FOUND");
      runId = byExt.id;
    }
  }

  const step = await pipelineRepository.upsertStep(runId, parsed.data);
  return apiSuccess(step, 201);
}
