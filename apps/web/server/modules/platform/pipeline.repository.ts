import {
  prisma,
  type PipelineRunStatus,
  type PipelineStepStatus,
  type Prisma,
} from "@oficina/database";
import type { UpsertPipelineRunInput, UpsertPipelineStepInput } from "@oficina/shared";

const TERMINAL: PipelineRunStatus[] = ["SUCCESS", "FAILURE", "CANCELLED"];

export const pipelineRepository = {
  async upsertRun(input: UpsertPipelineRunInput) {
    const provider = input.provider ?? "GITHUB_ACTIONS";
    const status = (input.status ?? "RUNNING") as PipelineRunStatus;
    const finishedAt =
      input.finished || TERMINAL.includes(status) ? new Date() : null;

    return prisma.platformPipelineRun.upsert({
      where: {
        provider_externalId: { provider, externalId: input.externalId },
      },
      create: {
        provider,
        externalId: input.externalId,
        workflow: input.workflow,
        branch: input.branch ?? null,
        commitSha: input.commitSha ?? null,
        event: input.event ?? null,
        status,
        url: input.url ?? null,
        deploymentUrl: input.deploymentUrl ?? null,
        finishedAt,
      },
      update: {
        workflow: input.workflow,
        ...(input.branch !== undefined ? { branch: input.branch } : {}),
        ...(input.commitSha !== undefined ? { commitSha: input.commitSha } : {}),
        ...(input.event !== undefined ? { event: input.event } : {}),
        ...(input.status !== undefined ? { status } : {}),
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.deploymentUrl !== undefined
          ? { deploymentUrl: input.deploymentUrl }
          : {}),
        ...(finishedAt ? { finishedAt } : {}),
      },
      include: { steps: { orderBy: { order: "asc" } } },
    });
  },

  async upsertStep(
    runId: string,
    input: UpsertPipelineStepInput,
  ) {
    const status = input.status as PipelineStepStatus;
    const now = new Date();
    const terminal = ["SUCCESS", "FAILURE", "SKIPPED", "CANCELLED"].includes(status);

    const existing = await prisma.platformPipelineStep.findUnique({
      where: { runId_name: { runId, name: input.name } },
    });

    if (existing) {
      return prisma.platformPipelineStep.update({
        where: { id: existing.id },
        data: {
          status,
          ...(input.order !== undefined ? { order: input.order } : {}),
          ...(input.logSummary !== undefined
            ? { logSummary: input.logSummary }
            : {}),
          ...(status === "RUNNING" && !existing.startedAt
            ? { startedAt: now }
            : {}),
          ...(terminal ? { finishedAt: now } : {}),
        },
      });
    }

    return prisma.platformPipelineStep.create({
      data: {
        runId,
        name: input.name,
        status,
        order: input.order ?? 0,
        logSummary: input.logSummary ?? null,
        startedAt: status === "PENDING" ? null : now,
        finishedAt: terminal ? now : null,
      },
    });
  },

  async findByExternal(provider: string, externalId: string) {
    return prisma.platformPipelineRun.findUnique({
      where: { provider_externalId: { provider, externalId } },
    });
  },

  async purgeOlderThan(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const result = await prisma.platformPipelineRun.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  },
};

export type PipelineRunWithSteps = Prisma.PlatformPipelineRunGetPayload<{
  include: { steps: true };
}>;
