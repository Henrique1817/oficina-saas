import { z } from "zod";

export const PIPELINE_RUN_STATUSES = [
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILURE",
  "CANCELLED",
] as const;

export const PIPELINE_STEP_STATUSES = [
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILURE",
  "SKIPPED",
  "CANCELLED",
] as const;

export const upsertPipelineRunSchema = z.object({
  provider: z.string().min(1).max(40).default("GITHUB_ACTIONS"),
  externalId: z.string().min(1).max(100),
  workflow: z.string().min(1).max(200),
  branch: z.string().max(200).optional().nullable(),
  commitSha: z.string().max(64).optional().nullable(),
  event: z.string().max(80).optional().nullable(),
  status: z.enum(PIPELINE_RUN_STATUSES),
  url: z.string().url().max(500).optional().nullable(),
  startedAt: z.string().datetime().optional().nullable(),
  finishedAt: z.string().datetime().optional().nullable(),
});

export const upsertPipelineStepSchema = z.object({
  name: z.string().min(1).max(120),
  stepOrder: z.number().int().min(0).max(100),
  status: z.enum(PIPELINE_STEP_STATUSES),
  startedAt: z.string().datetime().optional().nullable(),
  finishedAt: z.string().datetime().optional().nullable(),
  logSummary: z.string().max(8000).optional().nullable(),
});

export type UpsertPipelineRunInput = z.infer<typeof upsertPipelineRunSchema>;
export type UpsertPipelineStepInput = z.infer<typeof upsertPipelineStepSchema>;
