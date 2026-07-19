import Link from "next/link";
import { prisma, type PlanStatus } from "@oficina/database";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<PlanStatus, string> = {
  TRIALING: "Trial",
  ACTIVE: "Pago",
  PAST_DUE: "Inadimplente",
  CANCELED: "Cancelado",
};

export default async function OficinasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; suspended?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status as PlanStatus | undefined;
  const suspendedOnly = params.suspended === "1";

  const orgs = await prisma.organization.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { planStatus: status } : {},
        suspendedOnly ? { suspendedAt: { not: null } } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { memberships: true, customers: true, serviceOrders: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold">Oficinas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orgs.length} resultado(s) · busca e filtros
        </p>
      </div>

      <Card>
        <form className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs text-muted-foreground">
            Busca
            <input
              name="q"
              defaultValue={q}
              placeholder="Nome ou slug"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Status
            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Pago</option>
              <option value="TRIALING">Trial</option>
              <option value="PAST_DUE">Inadimplente</option>
              <option value="CANCELED">Cancelado</option>
            </select>
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
            <input type="checkbox" name="suspended" value="1" defaultChecked={suspendedOnly} />
            Só suspensas
          </label>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Filtrar
          </button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Membros</th>
              <th className="px-4 py-3">Clientes</th>
              <th className="px-4 py-3">OS</th>
              <th className="px-4 py-3">Criada</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-b border-border/40 hover:bg-muted/40">
                <td className="px-4 py-2.5">
                  <Link href={`/oficinas/${o.id}`} className="font-medium text-primary hover:underline">
                    {o.name}
                  </Link>
                  {o.suspendedAt && (
                    <span className="ml-2 rounded bg-danger/20 px-1.5 py-0.5 text-[10px] text-danger">
                      Suspensa
                    </span>
                  )}
                  {o.billingExempt && (
                    <span className="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
                      Cortesia
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{o.slug}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      o.planStatus === "ACTIVE" && "text-success",
                      o.planStatus === "PAST_DUE" && "text-danger",
                    )}
                  >
                    {STATUS_LABEL[o.planStatus]}
                  </span>
                </td>
                <td className="px-4 py-2.5">{o._count.memberships}</td>
                <td className="px-4 py-2.5">{o._count.customers}</td>
                <td className="px-4 py-2.5">{o._count.serviceOrders}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {o.createdAt.toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma oficina encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
