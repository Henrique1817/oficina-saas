import Link from "next/link";
import { Card } from "@/components/ui/card";
import { loadPlatformHealth } from "@/lib/platform-health";
import { STATUS_LABEL } from "@/lib/billing-metrics";

export const dynamic = "force-dynamic";

function pctBar(pct: number) {
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-accent transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export default async function SaudePage() {
  const h = await loadPlatformHealth();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold tracking-tight">
            Saúde do produto
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ritual semanal · aquisição, uso e autonomia · meta {h.money.targetMin}–
            {h.money.targetMax} ACTIVE
          </p>
        </div>
        <a
          href="/api/export/metrics"
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Exportar metrics.csv
        </a>
      </div>

      <Card className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Meta comercial</h2>
          <p className="text-sm text-muted-foreground">
            {h.counts.paid} ACTIVE · faltam <strong>{h.money.toTarget}</strong> para{" "}
            {h.money.targetMin}
          </p>
        </div>
        {pctBar(h.money.targetProgress)}
        <p className="text-xs text-muted-foreground">
          Barra até {h.money.targetMax} ACTIVE · MRR{" "}
          {h.money.mrrEstimate.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-muted-foreground">Signups (7d)</p>
          <p className="mt-1 text-3xl font-bold">{h.acquisition.signupsThisWeek}</p>
          <p className="text-xs text-muted-foreground">
            semana anterior: {h.acquisition.signupsPrevWeek}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Conversão trial→pago*</p>
          <p className="mt-1 text-3xl font-bold">
            {h.acquisition.conversionPct !== null
              ? `${h.acquisition.conversionPct}%`
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            ACTIVE / (ACTIVE+PAST_DUE+CANCELED)
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">OS (7d / 30d)</p>
          <p className="mt-1 text-3xl font-bold">
            {h.usage.osThisWeek}
            <span className="text-lg font-normal text-muted-foreground">
              {" "}
              / {h.usage.osThisMonth}
            </span>
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Orgs com uso (30d)</p>
          <p className="mt-1 text-3xl font-bold">{h.usage.activeInUse}</p>
          <p className="text-xs text-muted-foreground">proxy: ≥1 OS no período</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">Scorecard autonomia</h2>
            <p className="text-sm text-muted-foreground">
              {h.autonomy.score}/{h.autonomy.total}
            </p>
          </div>
          <ul className="space-y-1.5 text-sm">
            {h.autonomy.checks.map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <span className={c.ok ? "text-success" : "text-muted-foreground"}>
                  {c.ok ? "✓" : "○"}
                </span>
                <span>
                  {c.label}
                  {c.detail && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {c.detail}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Crons (último run)</h2>
          <ul className="space-y-2 text-sm">
            {h.autonomy.cronStatus.map((c) => (
              <li
                key={c.job}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2"
              >
                <div>
                  <p className="font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.schedule} ·{" "}
                    {c.lastRunAt
                      ? c.lastRunAt.toLocaleString("pt-BR")
                      : "ainda não rodou"}
                  </p>
                </div>
                <span
                  className={
                    c.fresh ? "text-xs text-success" : "text-xs text-danger"
                  }
                >
                  {c.fresh ? "OK (<48h)" : "Atrasado / vazio"}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Atualiza quando o Vercel (ou curl local) dispara os endpoints de cron.
          </p>
        </Card>
      </div>

      <Card className="space-y-2">
        <h2 className="font-semibold">Soft-launch agregado</h2>
        <p className="text-sm text-muted-foreground">
          {h.goLive.ready}/{h.goLive.tenants} tenants ({h.goLive.pct}%) com acesso + ≥1
          cliente + ≥1 peça + ≥1 OS
        </p>
        {pctBar(h.goLive.pct)}
      </Card>

      <Card className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Último deploy (CD)</h2>
          <Link href="/pipelines" className="text-xs text-primary hover:underline">
            Ver pipelines →
          </Link>
        </div>
        {h.pipeline.latestCd ? (
          <>
            <p
              className={
                h.pipeline.latestCd.status === "SUCCESS"
                  ? "text-success"
                  : h.pipeline.latestCd.status === "FAILURE"
                    ? "text-danger"
                    : "text-accent"
              }
            >
              {h.pipeline.latestCd.status} · {h.pipeline.latestCd.workflow}
            </p>
            <p className="text-xs text-muted-foreground">
              {h.pipeline.latestCd.branch ?? "—"} ·{" "}
              {h.pipeline.latestCd.commitSha?.slice(0, 7) ?? "—"} ·{" "}
              {h.pipeline.latestCd.createdAt.toLocaleString("pt-BR")}
            </p>
            {h.pipeline.latestCd.failedSteps.length > 0 && (
              <p className="text-xs text-danger">
                Steps com falha: {h.pipeline.latestCd.failedSteps.join(", ")}
              </p>
            )}
            <Link
              href={`/pipelines/${h.pipeline.latestCd.id}`}
              className="text-xs text-primary hover:underline"
            >
              Abrir run
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum CD registrado ainda.</p>
        )}
      </Card>

      {h.acquisition.trialsEndingSoon.length > 0 && (
        <Card className="space-y-2">
          <h2 className="font-semibold">Trials acabando (&lt; 3 dias)</h2>
          <ul className="space-y-1 text-sm">
            {h.acquisition.trialsEndingSoon.map((o) => (
              <li key={o.id}>
                <Link href={`/oficinas/${o.id}`} className="hover:underline">
                  {o.name}
                </Link>{" "}
                · até {o.trialEndsAt?.toLocaleDateString("pt-BR")}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-semibold">Top oficinas (OS totais)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-3">Oficina</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">OS</th>
                <th className="pb-2 pr-3">OS 30d</th>
                <th className="pb-2 pr-3">Peças</th>
                <th className="pb-2">Clientes</th>
              </tr>
            </thead>
            <tbody>
              {h.usage.topByOs.map((o) => (
                <tr key={o.id} className="border-b border-border/40">
                  <td className="py-2 pr-3">
                    <Link href={`/oficinas/${o.id}`} className="hover:underline">
                      {o.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{STATUS_LABEL[o.planStatus]}</td>
                  <td className="py-2 pr-3">{o.serviceOrders}</td>
                  <td className="py-2 pr-3">{o.osLast30d}</td>
                  <td className="py-2 pr-3">{o.parts}</td>
                  <td className="py-2">{o.customers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
