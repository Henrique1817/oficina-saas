import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, type PipelineRunStatus, type PipelineStepStatus } from "@oficina/database";
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
  SUCCESS: "Ok",
  FAILURE: "Falhou",
  SKIPPED: "Pulou",
  CANCELLED: "Cancelado",
};

function tone(status: string) {
  if (status === "SUCCESS") return "border-success/40 bg-success/10 text-success";
  if (status === "FAILURE") return "border-danger/40 bg-danger/10 text-danger";
  if (status === "RUNNING") return "border-accent/40 bg-accent/10 text-accent";
  return "border-border bg-muted/40 text-muted-foreground";
}

export default async function PipelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await prisma.platformPipelineRun.findUnique({
    where: { id },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
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
        <p className="mt-1 text-sm text-muted-foreground">
          {run.branch ?? "—"} · {run.commitSha?.slice(0, 7) ?? "—"} ·{" "}
          <span className={cn("font-medium", tone(run.status).split(" ").pop())}>
            {RUN_LABEL[run.status]}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        {run.url && (
          <a
            href={run.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border px-3 py-2 hover:bg-muted"
          >
            Abrir no GitHub Actions
          </a>
        )}
        <span className="rounded-lg border border-border px-3 py-2 text-muted-foreground">
          {run.provider} · {run.externalId}
        </span>
      </div>

      <Card className="space-y-0 p-0">
        <div className="border-b border-border px-5 py-3">
          <h2 className="font-semibold">Passo a passo</h2>
        </div>
        <ol className="relative space-y-0 px-5 py-4">
          {run.steps.length === 0 && (
            <li className="py-6 text-sm text-muted-foreground">Nenhum step registrado neste run.</li>
          )}
          {run.steps.map((step, i) => (
            <li key={step.id} className="relative flex gap-4 pb-8 last:pb-2">
              {i < run.steps.length - 1 && (
                <span
                  className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  tone(step.status),
                )}
              >
                {step.stepOrder + 1}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{step.name}</p>
                  <span className={cn("text-xs font-medium", tone(step.status).split(" ").pop())}>
                    {STEP_LABEL[step.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.startedAt
                    ? `início ${step.startedAt.toLocaleString("pt-BR")}`
                    : "—"}
                  {step.finishedAt
                    ? ` · fim ${step.finishedAt.toLocaleString("pt-BR")}`
                    : ""}
                </p>
                {step.logSummary && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap">
                    {step.logSummary}
                  </pre>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
