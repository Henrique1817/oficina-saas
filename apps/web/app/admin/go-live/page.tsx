import Link from "next/link";
import { getSessionOrRedirect } from "@/lib/session";
import { prisma } from "@oficina/database";
import { organizationHasAccess, isStripeConfigured } from "@/server/modules/billing";
import { Card } from "@/components/ui/card";

type Check = { id: string; label: string; ok: boolean; optional?: boolean; href?: string };

export default async function GoLivePage() {
  const session = await getSessionOrRedirect();
  if (session.role !== "ADMIN") {
    return (
      <main className="p-8">
        <p className="text-muted-foreground">Apenas administradores.</p>
      </main>
    );
  }

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: session.organizationId },
  });

  const [customers, orders, parts, members, invoiced] = await Promise.all([
    prisma.customer.count({ where: { organizationId: org.id } }),
    prisma.serviceOrder.count({ where: { organizationId: org.id } }),
    prisma.part.count({ where: { organizationId: org.id, active: true } }),
    prisma.membership.count({ where: { organizationId: org.id, active: true } }),
    prisma.serviceOrder.count({
      where: { organizationId: org.id, status: "INVOICED" },
    }),
  ]);

  const courtesy = org.billingExempt || org.designPartner;

  const checks: Check[] = [
    {
      id: "access",
      label: "Plano com acesso (ACTIVE, trial válido ou cortesia)",
      ok: organizationHasAccess(org),
      href: "/billing",
    },
    {
      id: "stripe-env",
      label: "Stripe configurado no ambiente",
      ok: isStripeConfigured() || courtesy,
      optional: courtesy,
      href: "/billing",
    },
    {
      id: "stripe-customer",
      label: courtesy
        ? "Customer Stripe (opcional em cortesia/piloto)"
        : "Customer Stripe vinculado à oficina",
      ok: Boolean(org.stripeCustomerId) || courtesy,
      optional: courtesy,
      href: "/billing",
    },
    {
      id: "customer",
      label: "Pelo menos 1 cliente cadastrado",
      ok: customers > 0,
      href: "/manager/customers",
    },
    {
      id: "part",
      label: "Pelo menos 1 peça no catálogo",
      ok: parts > 0,
      href: "/manager/parts",
    },
    {
      id: "os",
      label: "Pelo menos 1 ordem de serviço",
      ok: orders > 0,
      href: "/workshop/service-orders",
    },
    {
      id: "invoiced",
      label: "Ciclo completo: OS marcada como faturada",
      ok: invoiced > 0,
      href: "/workshop/service-orders",
    },
    {
      id: "team",
      label: "Convite / 2º usuário na equipe (opcional mas recomendado)",
      ok: members > 1,
      optional: true,
      href: "/admin/users",
    },
  ];

  const required = checks.filter((c) => !c.optional);
  const ready = required.every((c) => c.ok);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Soft launch — checklist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Critérios “bom o bastante” para operar de verdade · {org.name}
          {org.designPartner ? " · design partner" : ""}
          {org.billingExempt ? " · cortesia" : ""}
        </p>
      </div>

      <Card className="space-y-1">
        {checks.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 border-b border-border/50 py-3 last:border-0"
          >
            <div className="flex items-start gap-3">
              <span className={c.ok ? "text-success" : "text-danger"}>{c.ok ? "✓" : "○"}</span>
              <span className="text-sm">
                {c.label}
                {c.optional && (
                  <span className="ml-2 text-xs text-muted-foreground">opcional</span>
                )}
              </span>
            </div>
            {c.href && (
              <Link href={c.href} className="text-xs text-primary hover:underline">
                Abrir
              </Link>
            )}
          </div>
        ))}
      </Card>

      <p className={`text-sm font-medium ${ready ? "text-success" : "text-accent"}`}>
        {ready
          ? "Pronto para soft launch nesta oficina."
          : "Ainda faltam itens obrigatórios."}
      </p>

      <p className="text-sm text-muted-foreground">
        Playbook: <code className="text-xs">ops/fase-4-soft-launch.md</code>
      </p>
    </div>
  );
}
