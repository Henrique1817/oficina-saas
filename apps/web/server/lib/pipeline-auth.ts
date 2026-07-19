/** Autentica ingestão CI/CD: PIPELINE_INGEST_SECRET ou fallback CRON_SECRET. */
export function assertPipelineIngestAuth(request: Request): Response | null {
  const authHeader = request.headers.get("authorization");
  const secret =
    process.env.PIPELINE_INGEST_SECRET || process.env.CRON_SECRET || "";

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
