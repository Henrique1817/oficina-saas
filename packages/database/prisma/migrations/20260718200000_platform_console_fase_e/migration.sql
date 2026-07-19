-- CreateTable
CREATE TABLE IF NOT EXISTS "platform_cron_runs" (
  "id" TEXT NOT NULL,
  "job" TEXT NOT NULL,
  "last_run_at" TIMESTAMP(3) NOT NULL,
  "last_ok" BOOLEAN NOT NULL DEFAULT true,
  "meta" JSONB,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "platform_cron_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_cron_runs_job_key" ON "platform_cron_runs"("job");
