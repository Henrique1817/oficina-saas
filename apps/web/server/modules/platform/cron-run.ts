import { prisma, type Prisma } from "@oficina/database";

export type CronJobName =
  | "low-stock"
  | "trial-ending"
  | "dunning"
  | "pipeline-retention";

/** Registra última execução de cron (visível no console `/saude`). */
export async function recordCronRun(
  job: CronJobName,
  meta?: Prisma.InputJsonValue,
  lastOk = true,
) {
  const now = new Date();
  await prisma.platformCronRun.upsert({
    where: { job },
    create: {
      job,
      lastRunAt: now,
      lastOk,
      meta: meta ?? {},
    },
    update: {
      lastRunAt: now,
      lastOk,
      meta: meta ?? {},
    },
  });
}
