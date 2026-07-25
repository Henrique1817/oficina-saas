/** Auth Bearer para ingestão de pipeline (CI/CD). */
export function authorizePipelineIngest(request: Request): boolean {
  const secret =
    process.env.PIPELINE_INGEST_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
