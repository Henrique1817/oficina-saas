import Link from "next/link";
import { notFound } from "next/navigation";
import {
  prisma,
  type PipelineRunStatus,
  type PipelineStepStatus,
} from "@oficina/database";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RUN_LABEL: Record<PipelineRunStatus, string> = {
  PENDING: "Pendente",
  RUNNING: "Rodando",
  SUCCESS: "Sucesso",
  FAILURE: "Falhou",
  CANCELLED: "Cancelado",
};

const STEP_LABEL: Record<PipelineStepStatus, string> = {
  PENDING: "Pendente",
  RUNNING: "Rodando",
  SUCCESS: "Sucesso",
  FAILURE: "Falhou",
  SKIPPED: "Pulado",
  CANCELLED: "Cancelado",
};

function runClass(status: PipelineRunStatus) {
  if (status === "SUCCESS") return "text-success";
  if (status === "FAILURE") return "text-danger";
  if (status === "RUNNING") return "text-accent";
  return "text-muted-foreground";
}

function stepDot(status: PipelineStepStatus) {
  if (status === "SUCCESS") return "bg-success";
  if (status === "FAILURE") return "bg-danger";
  if (status === "RUNNING") return "bg-accent animate-pulse";
  if (status === "SKIPPED") return "bg-muted-foreground/40";
  return "bg-muted-foreground/30";
}

export default async function PipelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await prisma.platformPipelineRun.findUnique({
    where: { id },
    include: { steps: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
  });

  if (!run) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/pipelines" className="text-sm text-muted-foreground hover:text-foreground">
          ← Pipelines
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-ibm-plex)] text-2xl font-semibold">
          {run.workflow}
        </h1>
        <p className={cn("mt-1 text-sm font-medium", runClass(run.status))}>
          {RUN_LABEL[run.status]}
          {run.finishedAt
            ? ` · terminou ${run.finishedAt.toLocaleString("pt-BR")}`
            : ` · iniciado ${run.startedAt.toLocaleString("pt-BR")}`}
        </p>
      </div>

      <Card className="space-y-2">
        <h2 className="font-semibold">Metadados</h2>
        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-muted-foreground">Provider</dt>
          <dd>{run.provider}</dd>
          <dt className="text-muted-foreground">External ID</dt>
          <dd className="font-mono text-xs">{run.externalId}</dd>
          <dt className="text-muted-foreground">Branch</dt>
          <dd className="font-mono text-xs">{run.branch ?? "—"}</dd>
          <dt className="text-muted-foreground">Commit</dt>
          <dd className="font-mono text-xs">{run.commitSha ?? "—"}</dd>
          <dt className="text-muted-foreground">Evento</dt>
          <dd>{run.event ?? "—"}</dd>
          <dt className="text-muted-foreground">GitHub</dt>
          <dd>
            {run.url ? (
              <a
                href={run.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Abrir Actions
              </a>
            ) : (
              "—"
            )}
          </dd>
          <dt className="text-muted-foreground">Deploy</dt>
          <dd>
            {run.deploymentUrl ? (
              <a
                href={run.deploymentUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-primary hover:underline"
              >
                {run.deploymentUrl}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </dl>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">Passo a passo</h2>
        {run.steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum step reportado ainda.</p>
        ) : (
          <ol className="relative space-y-0 border-l border-border pl-6">
            {run.steps.map((step) => (
              <li key={step.id} className="relative pb-6 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[1.55rem] top-1 size-3 rounded-full ring-4 ring-background",
                    stepDot(step.status),
                  )}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    <span className="mr-2 text-xs text-muted-foreground">
                      #{step.order}
                    </span>
                    {step.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {STEP_LABEL[step.status]}
                    {step.finishedAt
                      ? ` · ${step.finishedAt.toLocaleString("pt-BR")}`
                      : step.startedAt
                        ? ` · desde ${step.startedAt.toLocaleString("pt-BR")}`
                        : ""}
                  </span>
                </div>
                {step.logSummary && (
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-xs whitespace-pre-wrap">
                    {step.logSummary}
                  </pre>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
