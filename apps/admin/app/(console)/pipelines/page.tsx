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
  if (status === "SUCCESS") return "bg-success/15 text-success";
  if (status === "FAILURE") return "bg-danger/15 text-danger";
  if (status === "RUNNING") return "bg-accent/15 text-accent";
  if (status === "CANCELLED") return "bg-muted text-muted-foreground";
  return "bg-muted text-muted-foreground";
}

export default async function PipelinesPage() {
  const runs = await prisma.platformPipelineRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      steps: { orderBy: { order: "asc" } },
      _count: { select: { steps: true } },
    },
  });

  const lastFail = runs.find((r) => r.status === "FAILURE");
  const lastSuccessDeploy = runs.find(
    (r) =>
      r.status === "SUCCESS" &&
      (r.workflow.toLowerCase().includes("cd") || Boolean(r.deploymentUrl)),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold tracking-tight">
          Pipelines
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          CI/CD do produto (GitHub Actions → Vercel) · passo a passo de cada run
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Runs recentes</p>
          <p className="mt-1 text-2xl font-semibold">{runs.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Último deploy OK</p>
          <p className="mt-1 text-sm font-medium">
            {lastSuccessDeploy
              ? lastSuccessDeploy.finishedAt?.toLocaleString("pt-BR") ??
                lastSuccessDeploy.createdAt.toLocaleString("pt-BR")
              : "—"}
          </p>
        </Card>
        <Card className={cn("p-4", lastFail && "border-danger/40")}>
          <p className="text-xs text-muted-foreground">Última falha</p>
          <p className="mt-1 text-sm font-medium">
            {lastFail ? (
              <Link href={`/pipelines/${lastFail.id}`} className="text-danger hover:underline">
                {lastFail.workflow} · {lastFail.createdAt.toLocaleString("pt-BR")}
              </Link>
            ) : (
              "Nenhuma"
            )}
          </p>
        </Card>
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
              <th className="px-4 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">
                  {run.createdAt.toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{run.workflow}</p>
                  <p className="text-xs text-muted-foreground">{run.event ?? "—"}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{run.branch ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {run.commitSha ? run.commitSha.slice(0, 7) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs",
                      statusClass(run.status),
                    )}
                  >
                    {STATUS_LABEL[run.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {run._count.steps}
                  {run.steps.length > 0 && (
                    <span className="ml-1 text-xs">
                      (
                      {run.steps.filter((s) => s.status === "SUCCESS").length}/
                      {run.steps.length} ok)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/pipelines/${run.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Detalhe
                  </Link>
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum run ainda. Após o primeiro CI/CD com{" "}
                  <code className="text-xs">PIPELINE_INGEST_*</code>, os steps
                  aparecem aqui.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-muted-foreground">
        Doc: <code>ops/pipeline-producao.md</code>
      </p>
    </div>
  );
}
