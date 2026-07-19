import { prisma, type Prisma } from "@oficina/database";

/** Registra última execução de cron (visível no console `/saude`). */
export async function recordCronRun(
  job: "low-stock" | "trial-ending" | "dunning",
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
