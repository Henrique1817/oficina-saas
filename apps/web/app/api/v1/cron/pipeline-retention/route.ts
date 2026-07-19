import { apiSuccess } from "@oficina/shared";
import { pipelineRepository } from "@/server/modules/platform/pipeline.repository";
import { recordCronRun } from "@/server/modules/platform/cron-run";

const RETENTION_DAYS = 90;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const deleted = await pipelineRepository.purgeOlderThan(RETENTION_DAYS);
    await recordCronRun("pipeline-retention", { deleted, days: RETENTION_DAYS }, true);
    return apiSuccess({ deleted, days: RETENTION_DAYS });
  } catch (e) {
    await recordCronRun(
      "pipeline-retention",
      { error: e instanceof Error ? e.message : "unknown" },
      false,
    );
    throw e;
  }
}
