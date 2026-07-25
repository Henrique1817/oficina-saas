import { apiSuccess } from "@oficina/shared";
import { pipelineRepository } from "@/server/modules/platform/pipeline.repository";
import { recordCronRun } from "@/server/modules/platform/cron-run";

/** Retenção: apaga runs de pipeline com mais de 90 dias. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const deleted = await pipelineRepository.pruneOlderThan(90);
    await recordCronRun("pipeline-prune", { deleted, retentionDays: 90 }, true);
    return apiSuccess({ deleted, retentionDays: 90 });
  } catch (e) {
    await recordCronRun(
      "pipeline-prune",
      { error: e instanceof Error ? e.message : "unknown" },
      false,
    );
    return Response.json(
      { error: e instanceof Error ? e.message : "Prune failed" },
      { status: 500 },
    );
  }
}
