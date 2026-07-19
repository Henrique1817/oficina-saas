import Link from "next/link";
import { getSessionOrRedirect } from "@/lib/session";
import { prisma, type PlanStatus } from "@oficina/database";
import { Card } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { CopySignupLink } from "@/components/actions/copy-signup-link";

function isPlatformAdmin(email: string) {
  const list = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  TRIALING: "Trial",
  ACTIVE: "Pago",
  PAST_DUE: "Inadimplente",
  CANCELED: "Cancelado",
};

export default async function GrowthPage() {
  const session = await getSessionOrRedirect();
  if (!isPlatformAdmin(session.profile.email)) {
    redirect("/workshop");
  }

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true, customers: true, serviceOrders: true } },
    },
  });

  const byStatus = (s: PlanStatus) => orgs.filter((o) => o.planStatus === s);
  const paid = byStatus("ACTIVE");
  const trialing = byStatus("TRIALING");
  const pastDue = byStatus("PAST_DUE");
  const canceled = byStatus("CANCELED");

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = orgs.filter((o) => o.createdAt.getTime() >= weekAgo).length;
  const trialsEndingSoon = trialing.filter(
    (o) =>
      o.trialEndsAt &&
      o.trialEndsAt.getTime() > now &&
      o.trialEndsAt.getTime() < now + 3 * 24 * 60 * 60 * 1000,
  );

  const mrrEstimate = paid.length * 97;
  const toTen = Math.max(0, 10 - paid.length);
  const toAutonomy = Math.max(0, 15 - paid.length);

  const autonomyChecks = [
    {
      id: "crons",
      label: "Crons (trial + estoque + dunning) no vercel.json",
      ok: true,
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
      id: "cron-secret",
      label: "CRON_SECRET configurado",
      ok: Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length > 8),
    },
    {
      id: "stripe",
      label: "Stripe secret configurada",
      ok: Boolean(
        process.env.STRIPE_SECRET_KEY &&
          !process.env.STRIPE_SECRET_KEY.includes("placeholder") &&
          process.env.STRIPE_SECRET_KEY.length > 10,
      ),
    },
    {
      id: "past-due-field",
      label: "Campo pastDueAt no schema (grace 3 dias)",
      ok: true,
    },
    {
      id: "paid-target",
      label: `≥ 15 pagos (atual: ${paid.length})`,
      ok: paid.length >= 15,
    },
  ];
  const autonomyScore = autonomyChecks.filter((c) => c.ok).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Growth — autonomia</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Meta comercial: 15–20 ACTIVE · faltam <strong>{toAutonomy}</strong> para 15 · primeiros
            10: faltam <strong>{toTen}</strong>
          </p>
        </div>
        <CopySignupLink />
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Scorecard autonomia</h2>
          <p className="text-sm text-muted-foreground">
            {autonomyScore}/{autonomyChecks.length} prontos
          </p>
        </div>
        <ul className="space-y-1.5 text-sm">
          {autonomyChecks.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <span className={c.ok ? "text-success" : "text-muted-foreground"}>
                {c.ok ? "✓" : "○"}
              </span>
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Detalhes: <code className="text-xs">ops/fase-6-autonomia.md</code>
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pagos (ACTIVE)</p>
          <p className="mt-1 text-3xl font-bold text-success">{paid.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Trials ativos</p>
          <p className="mt-1 text-3xl font-bold">{trialing.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">MRR estimado*</p>
          <p className="mt-1 text-3xl font-bold">
            {mrrEstimate.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Novas orgs (7 dias)</p>
          <p className="mt-1 text-3xl font-bold">{newThisWeek}</p>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        *MRR estimado = ACTIVE × R$ 97 (não diferencia anual). PAST_DUE: {pastDue.length} ·
        Cancelados: {canceled.length} · Trials acabando em 3 dias: {trialsEndingSoon.length}
      </p>

      {trialsEndingSoon.length > 0 && (
        <Card className="space-y-2 p-4">
          <h2 className="font-semibold">Trials acabando (3 dias)</h2>
          <ul className="space-y-1 text-sm">
            {trialsEndingSoon.map((o) => (
              <li key={o.id}>
                {o.name} · até {o.trialEndsAt?.toLocaleDateString("pt-BR")}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-semibold">Oficinas</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2">Nome</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Membros</th>
              <th className="pb-2">Clientes</th>
              <th className="pb-2">OS</th>
              <th className="pb-2">Criada</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-b border-border/50">
                <td className="py-2">{o.name}</td>
                <td className="py-2">{STATUS_LABEL[o.planStatus]}</td>
                <td className="py-2">{o._count.memberships}</td>
                <td className="py-2">{o._count.customers}</td>
                <td className="py-2">{o._count.serviceOrders}</td>
                <td className="py-2 text-muted-foreground">
                  {o.createdAt.toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-sm text-muted-foreground">
        Playbooks: <code className="text-xs">ops/fase-5-aquisicao.md</code> ·{" "}
        <code className="text-xs">ops/fase-6-autonomia.md</code> ·{" "}
        <Link href="/ajuda" className="text-primary hover:underline">
          FAQ público
        </Link>
      </p>
    </div>
  );
}
