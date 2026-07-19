import Link from "next/link";
import { prisma } from "@oficina/database";
import { Card } from "@/components/ui/card";
import { requirePlatformSession } from "@/lib/session";
import { hasCapability, PlatformCapability } from "@/lib/roles";
import { ProvisionPilotForm } from "./provision-form";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Readiness = {
  customers: number;
  parts: number;
  orders: number;
  invoiced: number;
  members: number;
  score: number;
  ready: boolean;
};

function readiness(counts: {
  customers: number;
  parts: number;
  orders: number;
  invoiced: number;
  members: number;
}): Readiness {
  const checks = [
    counts.customers > 0,
    counts.parts > 0,
    counts.orders > 0,
    counts.invoiced > 0,
  ];
  const score = checks.filter(Boolean).length + (counts.members > 1 ? 0.5 : 0);
  return {
    ...counts,
    score,
    ready: checks.every(Boolean),
  };
}

export default async function PilotosPage() {
  const session = await requirePlatformSession();
  const canWrite = hasCapability(session.role, PlatformCapability.tenantsWrite);

  const pilots = await prisma.organization.findMany({
    where: { designPartner: true },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          memberships: true,
          customers: true,
          serviceOrders: true,
          parts: true,
        },
      },
      invites: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const invoicedByOrg = await prisma.serviceOrder.groupBy({
    by: ["organizationId"],
    where: {
      organizationId: { in: pilots.map((p) => p.id) },
      status: "INVOICED",
    },
    _count: { _all: true },
  });
  const invoicedMap = new Map(
    invoicedByOrg.map((r) => [r.organizationId, r._count._all]),
  );

  const rows = pilots.map((p) => {
    const r = readiness({
      customers: p._count.customers,
      parts: p._count.parts,
      orders: p._count.serviceOrders,
      invoiced: invoicedMap.get(p.id) ?? 0,
      members: p._count.memberships,
    });
    return { org: p, readiness: r };
  });

  const readyCount = rows.filter((r) => r.readiness.ready).length;
  const target = 5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold">
          Soft launch — pilotos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cohort design partners · meta 3–{target} oficinas ·{" "}
          <span className={readyCount >= 3 ? "text-accent" : ""}>
            {readyCount}/{rows.length} prontas
          </span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">No cohort</p>
          <p className="mt-1 text-2xl font-semibold">{rows.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Go-live ok (cliente+peça+OS+faturada)</p>
          <p className="mt-1 text-2xl font-semibold">{readyCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Faltam p/ meta 3</p>
          <p className="mt-1 text-2xl font-semibold">{Math.max(0, 3 - readyCount)}</p>
        </Card>
      </div>

      {canWrite && (
        <Card className="space-y-3 p-5">
          <div>
            <h2 className="font-semibold">Provisionar piloto</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cria oficina com cortesia, marca design partner, local de estoque e convite ADMIN
              (30 dias). Sem Stripe.
            </p>
          </div>
          <ProvisionPilotForm />
        </Card>
      )}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3">Oficina</th>
                <th className="px-3 py-3">Contato</th>
                <th className="px-3 py-3">Trial</th>
                <th className="px-3 py-3">Uso</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ org, readiness: r }) => (
                <tr key={org.id} className="border-b border-border/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{org.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{org.slug}</p>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {org.designPartnerContact ?? "—"}
                    {org.invites[0] && (
                      <p className="mt-1 text-xs text-accent">Convite pendente</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {org.trialEndsAt?.toLocaleDateString("pt-BR") ?? "—"}
                    {org.billingExempt && (
                      <p className="text-xs text-accent">cortesia</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {r.customers} cl · {r.parts} pc · {r.orders} OS · {r.invoiced} fat ·{" "}
                    {r.members} usr
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs",
                        r.ready
                          ? "bg-accent/15 text-accent"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {r.ready ? "Pronta" : `Em onboarding (${Math.floor(r.score)}/4)`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/oficinas/${org.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum piloto ainda. Provisionar acima ou marcar “design partner” na ficha da
                    oficina.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        Playbook: <code>ops/fase-4-soft-launch.md</code> · planilha{" "}
        <code>ops/design-partners.csv</code>
      </p>
    </div>
  );
}
