-- CreateEnum
CREATE TYPE "PipelineRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILURE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PipelineStepStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILURE', 'SKIPPED', 'CANCELLED');

-- CreateTable
CREATE TABLE "platform_pipeline_runs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'GITHUB_ACTIONS',
    "external_id" TEXT NOT NULL,
    "workflow" TEXT NOT NULL,
    "branch" TEXT,
    "commit_sha" TEXT,
    "event" TEXT,
    "status" "PipelineRunStatus" NOT NULL DEFAULT 'PENDING',
    "url" TEXT,
    "deployment_url" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_pipeline_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_pipeline_steps" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PipelineStepStatus" NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL DEFAULT 0,
    "log_summary" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_pipeline_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_pipeline_runs_created_at_idx" ON "platform_pipeline_runs"("created_at");

-- CreateIndex
CREATE INDEX "platform_pipeline_runs_status_created_at_idx" ON "platform_pipeline_runs"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "platform_pipeline_runs_provider_external_id_key" ON "platform_pipeline_runs"("provider", "external_id");

-- CreateIndex
CREATE INDEX "platform_pipeline_steps_run_id_order_idx" ON "platform_pipeline_steps"("run_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "platform_pipeline_steps_run_id_name_key" ON "platform_pipeline_steps"("run_id", "name");

-- AddForeignKey
ALTER TABLE "platform_pipeline_steps" ADD CONSTRAINT "platform_pipeline_steps_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "platform_pipeline_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
