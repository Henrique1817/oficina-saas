import Link from "next/link";
import { Card } from "@/components/ui/card";
import { loadPlatformHealth } from "@/lib/platform-health";
import { STATUS_LABEL } from "@/lib/billing-metrics";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const h = await loadPlatformHealth();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold tracking-tight">
            Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Meta {h.money.targetMin}–{h.money.targetMax} ACTIVE ·{" "}
            <strong>{h.counts.paid}</strong> pagos · faltam{" "}
            <strong>{h.money.toTarget}</strong> para {h.money.targetMin}
          </p>
        </div>
        <Link
          href="/saude"
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Saúde do produto
        </Link>
      </div>

      <Card className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium">Progresso até {h.money.targetMax} ACTIVE</p>
          <p className="text-xs text-muted-foreground">{h.money.targetProgress}%</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success"
            style={{ width: `${h.money.targetProgress}%` }}
          />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-muted-foreground">Pagos (ACTIVE)</p>
          <p className="mt-1 text-3xl font-bold text-success">{h.counts.paid}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Trials</p>
          <p className="mt-1 text-3xl font-bold">{h.counts.trialing}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">MRR estimado*</p>
          <p className="mt-1 text-3xl font-bold">
            {h.money.mrrEstimate.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Novas (7 dias)</p>
          <p className="mt-1 text-3xl font-bold">{h.acquisition.signupsThisWeek}</p>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        *ACTIVE × R$ {h.money.mrrUnit} · PAST_DUE: {h.counts.pastDue} · Cancelados:{" "}
        {h.counts.canceled} · Conversão:{" "}
        {h.acquisition.conversionPct !== null
          ? `${h.acquisition.conversionPct}%`
          : "—"}{" "}
        · Autonomia: {h.autonomy.score}/{h.autonomy.total}
      </p>

      {h.pipeline.latestCd && h.pipeline.latestCd.status === "FAILURE" && (
        <Card className="border-danger/40 bg-danger/5 space-y-2">
          <h2 className="font-semibold text-danger">Último deploy falhou</h2>
          <p className="text-sm text-muted-foreground">
            {h.pipeline.latestCd.workflow} ·{" "}
            {h.pipeline.latestCd.createdAt.toLocaleString("pt-BR")}
            {h.pipeline.latestCd.failedSteps.length > 0
              ? ` · ${h.pipeline.latestCd.failedSteps.join(", ")}`
              : ""}
          </p>
          <Link
            href={`/pipelines/${h.pipeline.latestCd.id}`}
            className="text-xs text-primary hover:underline"
          >
            Ver passo a passo →
          </Link>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="font-semibold">Autonomia (resumo)</h2>
          <ul className="space-y-1 text-sm">
            {h.autonomy.checks.map((c) => (
              <li key={c.id} className="flex gap-2">
                <span className={c.ok ? "text-success" : "text-muted-foreground"}>
                  {c.ok ? "✓" : "○"}
                </span>
                {c.label}
              </li>
            ))}
          </ul>
          <div className="flex gap-3 text-xs">
            <Link href="/saude" className="text-primary hover:underline">
              Ver crons, uso e export →
            </Link>
            <Link href="/pipelines" className="text-primary hover:underline">
              Pipelines →
            </Link>
          </div>
        </Card>

        {h.acquisition.trialsEndingSoon.length > 0 ? (
          <Card className="space-y-2">
            <h2 className="font-semibold">Trials acabando</h2>
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
        ) : (
          <Card className="space-y-2">
            <h2 className="font-semibold">Uso (7d)</h2>
            <p className="text-3xl font-bold">{h.usage.osThisWeek}</p>
            <p className="text-xs text-muted-foreground">
              OS criadas · {h.usage.activeInUse} orgs com atividade em 30d
            </p>
          </Card>
        )}
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Oficinas recentes</h2>
          <div className="flex gap-3 text-xs">
            <Link href="/oficinas" className="text-primary hover:underline">
              Oficinas
            </Link>
            <Link href="/pagamentos" className="text-primary hover:underline">
              Pagamentos
            </Link>
            <Link href="/saude" className="text-primary hover:underline">
              Saúde
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-3">Nome</th>
                <th className="pb-2 pr-3">Slug</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Membros</th>
                <th className="pb-2 pr-3">OS</th>
                <th className="pb-2">Criada</th>
              </tr>
            </thead>
            <tbody>
              {h.recentOrgs.map((o) => (
                <tr key={o.id} className="border-b border-border/40">
                  <td className="py-2 pr-3">
                    <Link href={`/oficinas/${o.id}`} className="hover:underline">
                      {o.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                    {o.slug}
                  </td>
                  <td className="py-2 pr-3">{STATUS_LABEL[o.planStatus]}</td>
                  <td className="py-2 pr-3">{o.memberships}</td>
                  <td className="py-2 pr-3">{o.serviceOrders}</td>
                  <td className="py-2 text-muted-foreground">
                    {o.createdAt.toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
