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
  provider: z.string().min(1).max(64).default("GITHUB_ACTIONS"),
  externalId: z.string().min(1).max(128),
  workflow: z.string().min(1).max(200),
  branch: z.string().max(200).optional().nullable(),
  commitSha: z.string().max(64).optional().nullable(),
  event: z.string().max(64).optional().nullable(),
  status: z.enum(PIPELINE_RUN_STATUSES).optional(),
  url: z.string().url().max(2000).optional().nullable(),
  deploymentUrl: z.string().url().max(2000).optional().nullable(),
  finished: z.boolean().optional(),
});

export const upsertPipelineStepSchema = z.object({
  name: z.string().min(1).max(120),
  status: z.enum(PIPELINE_STEP_STATUSES),
  order: z.number().int().min(0).max(999).optional(),
  logSummary: z.string().max(8000).optional().nullable(),
  /** Alternativa a path id: provider+externalId do run */
  externalId: z.string().min(1).max(128).optional(),
  provider: z.string().min(1).max(64).optional(),
});

export type UpsertPipelineRunInput = z.infer<typeof upsertPipelineRunSchema>;
export type UpsertPipelineStepInput = z.infer<typeof upsertPipelineStepSchema>;
