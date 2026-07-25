import {
  prisma,
  type PipelineRunStatus,
  type PipelineStepStatus,
  type Prisma,
} from "@oficina/database";
import type { UpsertPipelineRunInput, UpsertPipelineStepInput } from "@oficina/shared";

function parseDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
}

export const pipelineRepository = {
  async upsertRun(input: UpsertPipelineRunInput) {
    const data: Prisma.PlatformPipelineRunCreateInput = {
      provider: input.provider,
      externalId: input.externalId,
      workflow: input.workflow,
      branch: input.branch ?? null,
      commitSha: input.commitSha ?? null,
      event: input.event ?? null,
      status: input.status as PipelineRunStatus,
      url: input.url ?? null,
      startedAt: parseDate(input.startedAt) ?? undefined,
      finishedAt: parseDate(input.finishedAt) ?? undefined,
    };

    return prisma.platformPipelineRun.upsert({
      where: {
        provider_externalId: {
          provider: input.provider,
          externalId: input.externalId,
        },
      },
      create: data,
      update: {
        workflow: data.workflow,
        branch: data.branch,
        commitSha: data.commitSha,
        event: data.event,
        status: data.status,
        url: data.url,
        ...(input.startedAt !== undefined
          ? { startedAt: parseDate(input.startedAt) }
          : {}),
        ...(input.finishedAt !== undefined
          ? { finishedAt: parseDate(input.finishedAt) }
          : {}),
      },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  },

  async upsertStep(runId: string, input: UpsertPipelineStepInput) {
    const run = await prisma.platformPipelineRun.findUnique({ where: { id: runId } });
    if (!run) return null;

    return prisma.platformPipelineStep.upsert({
      where: {
        runId_name: { runId, name: input.name },
      },
      create: {
        runId,
        name: input.name,
        stepOrder: input.stepOrder,
        status: input.status as PipelineStepStatus,
        startedAt: parseDate(input.startedAt) ?? null,
        finishedAt: parseDate(input.finishedAt) ?? null,
        logSummary: input.logSummary ?? null,
      },
      update: {
        stepOrder: input.stepOrder,
        status: input.status as PipelineStepStatus,
        ...(input.startedAt !== undefined
          ? { startedAt: parseDate(input.startedAt) }
          : {}),
        ...(input.finishedAt !== undefined
          ? { finishedAt: parseDate(input.finishedAt) }
          : {}),
        ...(input.logSummary !== undefined
          ? { logSummary: input.logSummary }
          : {}),
      },
    });
  },

  async listRuns(limit = 40) {
    return prisma.platformPipelineRun.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        _count: { select: { steps: true } },
      },
    });
  },

  async getRun(id: string) {
    return prisma.platformPipelineRun.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  },

  async getLatestDeployRun() {
    return prisma.platformPipelineRun.findFirst({
      where: {
        OR: [{ workflow: { contains: "cd" } }, { workflow: { contains: "CD" } }],
      },
      orderBy: { createdAt: "desc" },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
  },

  /** Remove runs (e steps em cascade) mais antigos que `olderThanDays`. */
  async pruneOlderThan(olderThanDays: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const result = await prisma.platformPipelineRun.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  },
};
