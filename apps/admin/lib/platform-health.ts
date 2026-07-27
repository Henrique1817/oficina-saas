import { prisma, type PlanStatus } from "@oficina/database";
import { estimateMrr, MRR_UNIT_BRL } from "@/lib/billing-metrics";

const DAY_MS = 24 * 60 * 60 * 1000;
const CRON_STALE_MS = 48 * DAY_MS;
export const ACTIVE_TARGET_MIN = 15;
export const ACTIVE_TARGET_MAX = 20;

export type AutonomyCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail?: string;
};

export async function loadPlatformHealth() {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * DAY_MS);
  const twoWeeksAgo = new Date(now - 14 * DAY_MS);
  const monthAgo = new Date(now - 30 * DAY_MS);

  const [orgs, cronRuns, osThisWeek, osThisMonth, partsByOrg, latestCdRun] =
    await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            memberships: true,
            customers: true,
            serviceOrders: true,
            parts: true,
          },
        },
      },
    }),
    prisma.platformCronRun.findMany(),
    prisma.serviceOrder.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.serviceOrder.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.part.groupBy({
      by: ["organizationId"],
      where: { active: true },
      _count: { _all: true },
    }),
    prisma.platformPipelineRun.findFirst({
      where: {
        OR: [
          { workflow: { equals: "CD Web" } },
          { workflow: { contains: "CD", mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    }),
  ]);

  const byStatus = (s: PlanStatus) => orgs.filter((o) => o.planStatus === s);
  const paid = byStatus("ACTIVE");
  const trialing = byStatus("TRIALING");
  const pastDue = byStatus("PAST_DUE");
  const canceled = byStatus("CANCELED");

  const signupsThisWeek = orgs.filter((o) => o.createdAt >= weekAgo).length;
  const signupsPrevWeek = orgs.filter(
    (o) => o.createdAt >= twoWeeksAgo && o.createdAt < weekAgo,
  ).length;

  /** Orgs que já saíram do trial (proxy de conversão trial → pago). */
  const leftFunnel = paid.length + pastDue.length + canceled.length;
  const conversionPct =
    leftFunnel > 0 ? Math.round((paid.length / leftFunnel) * 1000) / 10 : null;

  /** Orgs “ativas em uso”: OS criada nos últimos 30 dias. */
  const orgsWithRecentOs = await prisma.serviceOrder.groupBy({
    by: ["organizationId"],
    where: { createdAt: { gte: monthAgo } },
    _count: { _all: true },
  });
  const recentOsMap = new Map(
    orgsWithRecentOs.map((r) => [r.organizationId, r._count._all]),
  );
  const activeInUse = orgsWithRecentOs.length;

  const partsMap = new Map(partsByOrg.map((p) => [p.organizationId, p._count._all]));

  const topByOs = [...orgs]
    .sort((a, b) => b._count.serviceOrders - a._count.serviceOrders)
    .slice(0, 8)
    .map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      planStatus: o.planStatus,
      serviceOrders: o._count.serviceOrders,
      parts: partsMap.get(o.id) ?? o._count.parts,
      customers: o._count.customers,
      osLast30d: recentOsMap.get(o.id) ?? 0,
    }));

  /** Soft-launch agregado (mesmos critérios principais do go-live tenant). */
  const tenants = orgs.filter((o) => !o.billingExempt);
  let goLiveReady = 0;
  for (const o of tenants) {
    const access =
      o.planStatus === "ACTIVE" ||
      (o.planStatus === "TRIALING" &&
        (!o.trialEndsAt || o.trialEndsAt.getTime() > now)) ||
      o.billingExempt;
    const ok =
      access &&
      o._count.customers > 0 &&
      o._count.parts > 0 &&
      o._count.serviceOrders > 0;
    if (ok) goLiveReady += 1;
  }

  const cronByJob = Object.fromEntries(cronRuns.map((c) => [c.job, c]));
  const cronJobs = [
    { job: "low-stock", label: "Estoque baixo", schedule: "08:00 UTC" },
    { job: "trial-ending", label: "Trial acabando", schedule: "09:00 UTC" },
    { job: "dunning", label: "Dunning PAST_DUE", schedule: "10:00 UTC" },
    { job: "pipeline-prune", label: "Retenção pipelines", schedule: "Dom 03:00 UTC" },
  ] as const;

  const cronStatus = cronJobs.map((j) => {
    const run = cronByJob[j.job];
    const ageMs = run ? now - run.lastRunAt.getTime() : null;
    const fresh = ageMs !== null && ageMs < CRON_STALE_MS;
    return {
      ...j,
      lastRunAt: run?.lastRunAt ?? null,
      lastOk: run?.lastOk ?? null,
      fresh,
      meta: run?.meta ?? null,
    };
  });

  const autonomyChecks: AutonomyCheck[] = [
    {
      id: "crons-defined",
      label: "Crons no vercel.json (trial + estoque + dunning + pipeline)",
      ok: true,
    },
    {
      id: "cron-secret",
      label: "CRON_SECRET configurado",
      ok: Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length > 8),
    },
    {
      id: "resend",
      label: "RESEND_API_KEY configurada",
      ok: Boolean(
        process.env.RESEND_API_KEY &&
          !process.env.RESEND_API_KEY.includes("placeholder"),
      ),
    },
    {
      id: "mercadopago",
      label: "Mercado Pago access token configurado",
      ok: Boolean(
        process.env.MERCADOPAGO_ACCESS_TOKEN &&
          !process.env.MERCADOPAGO_ACCESS_TOKEN.includes("placeholder") &&
          process.env.MERCADOPAGO_ACCESS_TOKEN.length > 20,
      ),
    },
    {
      id: "cron-fresh",
      label: "Crons operacionais rodaram nas últimas 48h",
      ok: cronStatus
        .filter((c) => c.job !== "pipeline-prune")
        .every((c) => c.fresh),
      detail: cronStatus
        .map((c) =>
          c.lastRunAt
            ? `${c.job}: ${c.lastRunAt.toLocaleString("pt-BR")}`
            : `${c.job}: nunca`,
        )
        .join(" · "),
    },
    {
      id: "paid-target",
      label: `≥ ${ACTIVE_TARGET_MIN} ACTIVE (atual: ${paid.length})`,
      ok: paid.length >= ACTIVE_TARGET_MIN,
    },
    {
      id: "last-cd",
      label: "Último deploy CD sucesso",
      ok: latestCdRun?.status === "SUCCESS",
      detail: latestCdRun
        ? `${latestCdRun.workflow} · ${latestCdRun.status} · ${latestCdRun.createdAt.toLocaleString("pt-BR")}`
        : "Nenhum run CD ainda",
    },
  ];

  const mrrEstimate = estimateMrr(paid.length);
  const toTarget = Math.max(0, ACTIVE_TARGET_MIN - paid.length);
  const targetProgress = Math.min(
    100,
    Math.round((paid.length / ACTIVE_TARGET_MAX) * 100),
  );

  const trialsEndingSoon = trialing.filter(
    (o) =>
      !o.billingExempt &&
      o.trialEndsAt &&
      o.trialEndsAt.getTime() > now &&
      o.trialEndsAt.getTime() < now + 3 * DAY_MS,
  );

  return {
    counts: {
      paid: paid.length,
      trialing: trialing.length,
      pastDue: pastDue.length,
      canceled: canceled.length,
      total: orgs.length,
      courtesy: orgs.filter((o) => o.billingExempt).length,
    },
    acquisition: {
      signupsThisWeek,
      signupsPrevWeek,
      conversionPct,
      leftFunnel,
      trialsEndingSoon: trialsEndingSoon.map((o) => ({
        id: o.id,
        name: o.name,
        trialEndsAt: o.trialEndsAt,
      })),
    },
    usage: {
      osThisWeek,
      osThisMonth,
      activeInUse,
      topByOs,
    },
    goLive: {
      tenants: tenants.length,
      ready: goLiveReady,
      pct: tenants.length
        ? Math.round((goLiveReady / tenants.length) * 1000) / 10
        : 0,
    },
    autonomy: {
      checks: autonomyChecks,
      score: autonomyChecks.filter((c) => c.ok).length,
      total: autonomyChecks.length,
      cronStatus,
    },
    money: {
      mrrEstimate,
      mrrUnit: MRR_UNIT_BRL,
      toTarget,
      targetProgress,
      targetMin: ACTIVE_TARGET_MIN,
      targetMax: ACTIVE_TARGET_MAX,
    },
    pipeline: {
      latestCd: latestCdRun
        ? {
            id: latestCdRun.id,
            workflow: latestCdRun.workflow,
            status: latestCdRun.status,
            branch: latestCdRun.branch,
            commitSha: latestCdRun.commitSha,
            url: latestCdRun.url,
            createdAt: latestCdRun.createdAt,
            failedSteps: latestCdRun.steps
              .filter((s) => s.status === "FAILURE")
              .map((s) => s.name),
          }
        : null,
    },
    recentOrgs: orgs.slice(0, 12).map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      planStatus: o.planStatus,
      memberships: o._count.memberships,
      serviceOrders: o._count.serviceOrders,
      createdAt: o.createdAt,
    })),
  };
}

export function metricsCsvFromHealth(
  health: Awaited<ReturnType<typeof loadPlatformHealth>>,
): string {
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday-ish
  const week = weekStart.toISOString().slice(0, 10);
  const header =
    "week_start,trials_started,trials_active,paid_new,paid_active,mrr_brl,churned,notes";
  const notes = `export console · conv=${health.acquisition.conversionPct ?? "n/a"}% · os7d=${health.usage.osThisWeek}`;
  const row = [
    week,
    health.acquisition.signupsThisWeek,
    health.counts.trialing,
    "", // paid_new — não trackeamos delta sem histórico
    health.counts.paid,
    health.money.mrrEstimate,
    health.counts.canceled,
    `"${notes.replace(/"/g, '""')}"`,
  ].join(",");
  return `${header}\n${row}\n`;
}
