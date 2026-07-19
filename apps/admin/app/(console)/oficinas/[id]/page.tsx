import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@oficina/database";
import { Card } from "@/components/ui/card";
import { OrgActions } from "../org-actions";
import { STATUS_LABEL, stripeDashboardUrl } from "@/lib/billing-metrics";
import { requirePlatformSession } from "@/lib/session";
import { hasCapability, PlatformCapability } from "@/lib/roles";
import { ACTION_LABEL, buildOrgTimeline } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function OficinaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePlatformSession();
  const { id } = await params;
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: { select: { memberships: true, customers: true, serviceOrders: true } },
      memberships: {
        where: { active: true },
        take: 20,
        include: { user: { select: { email: true, fullName: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!org) notFound();

  const timeline = await buildOrgTimeline(org.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/oficinas" className="text-sm text-muted-foreground hover:text-foreground">
          ← Oficinas
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold">
          {org.name}
        </h1>
        <p className="font-mono text-sm text-muted-foreground">{org.slug}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2">
          <h2 className="font-semibold">Plano e acesso</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Status</dt>
            <dd>{STATUS_LABEL[org.planStatus]}</dd>
            <dt className="text-muted-foreground">Trial até</dt>
            <dd>{org.trialEndsAt?.toLocaleDateString("pt-BR") ?? "—"}</dd>
            <dt className="text-muted-foreground">Past due desde</dt>
            <dd>{org.pastDueAt?.toLocaleDateString("pt-BR") ?? "—"}</dd>
            <dt className="text-muted-foreground">Suspensa</dt>
            <dd className={org.suspendedAt ? "text-danger" : ""}>
              {org.suspendedAt ? org.suspendedAt.toLocaleString("pt-BR") : "Não"}
            </dd>
            <dt className="text-muted-foreground">Cortesia</dt>
            <dd className={org.billingExempt ? "text-accent" : ""}>
              {org.billingExempt ? "Sim (sem cobrança/dunning)" : "Não"}
            </dd>
            <dt className="text-muted-foreground">Criada</dt>
            <dd>{org.createdAt.toLocaleString("pt-BR")}</dd>
            <dt className="text-muted-foreground">Uso</dt>
            <dd>
              {org._count.memberships} membros · {org._count.customers} clientes ·{" "}
              {org._count.serviceOrders} OS
            </dd>
          </dl>
        </Card>

        <Card className="space-y-2">
          <h2 className="font-semibold">Stripe</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              {org.stripeCustomerId ? (
                <a
                  href={stripeDashboardUrl("customers", org.stripeCustomerId)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {org.stripeCustomerId}
                </a>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subscription</p>
              {org.stripeSubscriptionId ? (
                <a
                  href={stripeDashboardUrl("subscriptions", org.stripeSubscriptionId)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {org.stripeSubscriptionId}
                </a>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              Portal do cliente: o tenant usa{" "}
              <code className="text-[11px]">/billing</code> no produto.
            </p>
          </dl>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Ações</h2>
        <OrgActions
          organizationId={org.id}
          suspended={Boolean(org.suspendedAt)}
          billingExempt={org.billingExempt}
          initialNote={org.internalNote ?? ""}
          canTenantsWrite={hasCapability(session.role, PlatformCapability.tenantsWrite)}
          canBillingWrite={hasCapability(session.role, PlatformCapability.billingWrite)}
          canImpersonate={hasCapability(session.role, PlatformCapability.impersonate)}
        />
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">Membros (até 20)</h2>
        <ul className="space-y-1 text-sm">
          {org.memberships.map((m) => (
            <li key={m.id} className="flex justify-between gap-2 border-b border-border/40 py-1.5">
              <span>
                {m.user.fullName}{" "}
                <span className="text-muted-foreground">({m.user.email})</span>
              </span>
              <span className="text-xs text-muted-foreground">{m.role}</span>
            </li>
          ))}
          {org.memberships.length === 0 && (
            <li className="text-muted-foreground">Nenhum membro ativo</li>
          )}
        </ul>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Timeline</h2>
          <Link href="/audit" className="text-xs text-primary hover:underline">
            Audit global
          </Link>
        </div>
        <ul className="space-y-2 text-sm">
          {timeline.slice(0, 40).map((e, i) => (
            <li key={`${e.kind}-${e.at.toISOString()}-${i}`} className="border-b border-border/40 pb-2">
              <p className="text-xs text-muted-foreground">
                {e.at.toLocaleString("pt-BR")} · {e.kind}
              </p>
              <p className="font-medium">
                {e.kind === "audit" ? (ACTION_LABEL[e.label] ?? e.label) : e.label}
              </p>
              {e.meta && (
                <p className="truncate font-mono text-[10px] text-muted-foreground">{e.meta}</p>
              )}
            </li>
          ))}
          {timeline.length === 0 && (
            <li className="text-muted-foreground">Sem eventos</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
