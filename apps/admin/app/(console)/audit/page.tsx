import Link from "next/link";
import { prisma } from "@oficina/database";
import { Card } from "@/components/ui/card";
import { ACTION_LABEL } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const action = params.action?.trim() ?? "";

  const logs = await prisma.platformAuditLog.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { actorEmail: { contains: q, mode: "insensitive" } },
                { organizationId: { contains: q } },
                { action: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        action ? { action: { contains: action, mode: "insensitive" } } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold tracking-tight">
          Audit log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem suspendeu, impersonou, estendeu trial, mudou equipe ou cortesia
        </p>
      </div>

      <Card>
        <form method="get" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="E-mail, action ou org id"
            className="min-w-[180px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            name="action"
            defaultValue={action}
            placeholder="Filtro action (ex.: org.suspend)"
            className="min-w-[180px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
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
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Ator</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Oficina</th>
              <th className="px-4 py-3">Meta</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                  Nenhum evento
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-border/40">
                <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">
                  {l.createdAt.toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-2 text-xs">{l.actorEmail}</td>
                <td className="px-4 py-2">
                  <span className="font-medium">
                    {ACTION_LABEL[l.action] ?? l.action}
                  </span>
                  <p className="font-mono text-[10px] text-muted-foreground">{l.action}</p>
                </td>
                <td className="px-4 py-2 text-xs">
                  {l.organization ? (
                    <Link
                      href={`/oficinas/${l.organization.id}`}
                      className="text-primary hover:underline"
                    >
                      {l.organization.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-[220px] truncate px-4 py-2 font-mono text-[10px] text-muted-foreground">
                  {l.metadata ? JSON.stringify(l.metadata) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
