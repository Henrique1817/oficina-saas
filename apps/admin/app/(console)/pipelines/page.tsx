import Link from "next/link";
import { prisma, type PipelineRunStatus } from "@oficina/database";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<PipelineRunStatus, string> = {
  PENDING: "Pendente",
  RUNNING: "Rodando",
  SUCCESS: "Sucesso",
  FAILURE: "Falhou",
  CANCELLED: "Cancelado",
};

function statusClass(status: PipelineRunStatus) {
  if (status === "SUCCESS") return "text-success";
  if (status === "FAILURE") return "text-danger";
  if (status === "RUNNING") return "text-accent";
  return "text-muted-foreground";
}

export default async function PipelinesPage() {
  const runs = await prisma.platformPipelineRun.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      _count: { select: { steps: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold tracking-tight">
          Pipelines
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          CI/CD (GitHub Actions) · passo a passo de verify, migrate, deploy e smoke
        </p>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Commit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Steps</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => {
              const failed = run.steps.filter((s) => s.status === "FAILURE").length;
              return (
                <tr key={run.id} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">
                    {run.createdAt.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{run.workflow}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {run.event ?? "—"} · {run.externalId}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{run.branch ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {run.commitSha ? run.commitSha.slice(0, 7) : "—"}
                  </td>
                  <td className={cn("px-4 py-3 font-medium", statusClass(run.status))}>
                    {STATUS_LABEL[run.status]}
                    {failed > 0 && (
                      <span className="ml-1 text-xs text-danger">({failed} step)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{run._count.steps}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/pipelines/${run.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Detalhe
                    </Link>
                  </td>
                </tr>
              );
            })}
            {runs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum run ainda. Após o primeiro CI/CD com{" "}
                  <code className="text-xs">PIPELINE_API_BASE</code>, os logs aparecem aqui.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
