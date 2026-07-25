import Link from "next/link";
import { prisma, type PlanStatus } from "@oficina/database";
import { Card } from "@/components/ui/card";
import {
  STATUS_LABEL,
  estimateMrr,
  mpPreapprovalUrl,
} from "@/lib/billing-metrics";
import { BillingExemptButton } from "./billing-exempt-button";
import { requirePlatformSession } from "@/lib/session";
import { hasCapability, PlatformCapability } from "@/lib/roles";

export default async function PagamentosPage() {
  const session = await requirePlatformSession();
  const canBillingWrite = hasCapability(session.role, PlatformCapability.billingWrite);

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      planStatus: true,
      trialEndsAt: true,
      pastDueAt: true,
      suspendedAt: true,
      billingExempt: true,
      mpPayerId: true,
      mpPreapprovalId: true,
      mpPlanId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const byStatus = (s: PlanStatus) => orgs.filter((o) => o.planStatus === s);
  const paid = byStatus("ACTIVE");
  const trialing = byStatus("TRIALING");
  const pastDue = byStatus("PAST_DUE");
  const canceled = byStatus("CANCELED");
  const courtesy = orgs.filter((o) => o.billingExempt);

  const now = Date.now();
  const in3d = now + 3 * 24 * 60 * 60 * 1000;
  const days30 = now - 30 * 24 * 60 * 60 * 1000;

  const trialsEndingSoon = trialing.filter(
    (o) =>
      !o.billingExempt &&
      o.trialEndsAt &&
      o.trialEndsAt.getTime() > now &&
      o.trialEndsAt.getTime() < in3d,
  );

  const pastDueQueue = pastDue.filter((o) => !o.billingExempt);
  const churn30d = canceled.filter((o) => o.updatedAt.getTime() >= days30).length;
  const mrrEstimate = estimateMrr(paid.length);
  const withSub = orgs.filter((o) => o.mpPreapprovalId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold tracking-tight">
          Pagamentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receita e cobrança · mesmo critério de MRR do growth (ACTIVE × R$ 97)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <p className="text-xs text-muted-foreground">MRR estimado</p>
          <p className="mt-1 text-2xl font-bold">
            {mrrEstimate.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">ACTIVE</p>
          <p className="mt-1 text-2xl font-bold text-success">{paid.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">TRIALING</p>
          <p className="mt-1 text-2xl font-bold">{trialing.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">PAST_DUE</p>
          <p className="mt-1 text-2xl font-bold text-danger">{pastDue.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">CANCELED</p>
          <p className="mt-1 text-2xl font-bold">{canceled.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Churn 30d*</p>
          <p className="mt-1 text-2xl font-bold">{churn30d}</p>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        *CANCELED com <code>updatedAt</code> nos últimos 30 dias · Cortesia: {courtesy.length} org(s)
        · Assinaturas Mercado Pago: {withSub.length}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="font-semibold">Fila PAST_DUE</h2>
          {pastDueQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma inadimplência ativa</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {pastDueQueue.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2"
                >
                  <div>
                    <Link href={`/oficinas/${o.id}`} className="font-medium hover:underline">
                      {o.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      desde {o.pastDueAt?.toLocaleDateString("pt-BR") ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {o.mpPreapprovalId && (
                      <a
                        href={mpPreapprovalUrl(o.mpPreapprovalId)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Mercado Pago
                      </a>
                    )}
                    <BillingExemptButton organizationId={o.id} exempt={o.billingExempt} canWrite={canBillingWrite} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold">Trials acabando (&lt; 3 dias)</h2>
          {trialsEndingSoon.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum trial crítico</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {trialsEndingSoon.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2"
                >
                  <div>
                    <Link href={`/oficinas/${o.id}`} className="font-medium hover:underline">
                      {o.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      até {o.trialEndsAt?.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Link
                    href={`/oficinas/${o.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Estender trial
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Cobrança (com assinatura Mercado Pago)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-3">Oficina</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Trial</th>
                <th className="pb-2 pr-3">Past due</th>
                <th className="pb-2 pr-3">Mercado Pago</th>
                <th className="pb-2">Cortesia</th>
              </tr>
            </thead>
            <tbody>
              {withSub.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-muted-foreground">
                    Nenhuma org com <code>mpPreapprovalId</code>
                  </td>
                </tr>
              )}
              {withSub.map((o) => (
                <tr key={o.id} className="border-b border-border/40">
                  <td className="py-2 pr-3">
                    <Link href={`/oficinas/${o.id}`} className="hover:underline">
                      {o.name}
                    </Link>
                    <p className="font-mono text-[11px] text-muted-foreground">{o.slug}</p>
                  </td>
                  <td className="py-2 pr-3">{STATUS_LABEL[o.planStatus]}</td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {o.trialEndsAt?.toLocaleDateString("pt-BR") ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {o.pastDueAt?.toLocaleDateString("pt-BR") ?? "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-col gap-0.5">
                      {o.mpPlanId && (
                        <span className="text-xs text-muted-foreground">{o.mpPlanId}</span>
                      )}
                      {o.mpPreapprovalId && (
                        <a
                          href={mpPreapprovalUrl(o.mpPreapprovalId)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Preapproval
                        </a>
                      )}
                      {o.mpPayerId && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          payer {o.mpPayerId}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2">
                    <BillingExemptButton organizationId={o.id} exempt={o.billingExempt} canWrite={canBillingWrite} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {courtesy.length > 0 && (
        <Card className="space-y-2">
          <h2 className="font-semibold">Orgs em cortesia</h2>
          <ul className="space-y-1 text-sm">
            {courtesy.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/oficinas/${o.id}`} className="hover:underline">
                  {o.name}{" "}
                  <span className="font-mono text-xs text-muted-foreground">({o.slug})</span>
                </Link>
                <BillingExemptButton organizationId={o.id} exempt={o.billingExempt} canWrite={canBillingWrite} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
