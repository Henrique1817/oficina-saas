import Link from "next/link";
import { toolRepository } from "@/server/modules/tools/tool.repository";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSessionOrRedirect } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function ToolsPage() {
  const { organizationId } = await getSessionOrRedirect();
  const tools = await toolRepository.list(organizationId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="04 · Ferramentas"
        title="Patrimônio na bancada"
        description="Retirada e devolução pela OS (aprovada / em andamento) ou visão geral aqui."
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => {
          const checkout = t.checkouts[0];
          return (
            <Card key={t.id} className="bg-bg/50">
              <p className="mono-label text-ink-mute">{t.assetCode}</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-ink">{t.name}</p>
              <p
                className={cn(
                  "mt-3 inline-block border px-2 py-1 mono-label",
                  t.status === "AVAILABLE" && "border-ok/40 bg-ok/10 text-ok",
                  t.status === "IN_USE" && "border-signal/40 bg-signal/10 text-signal",
                  t.status !== "AVAILABLE" &&
                    t.status !== "IN_USE" &&
                    "border-alert/40 bg-alert/10 text-alert",
                )}
              >
                {t.status}
              </p>
              {checkout && (
                <div className="mt-3 space-y-1 text-xs text-ink-mute">
                  <p>
                    Em uso:{" "}
                    <span className="text-ink-dim">{checkout.checkedOutBy.fullName}</span>
                  </p>
                  {checkout.serviceOrder && (
                    <p>
                      OS{" "}
                      <Link
                        href={`/workshop/service-orders/${checkout.serviceOrder.id}`}
                        className="text-signal hover:underline"
                      >
                        #{checkout.serviceOrder.orderNumber}
                      </Link>
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {tools.length === 0 && (
        <Card>
          <p className="text-center text-ink-mute">Nenhuma ferramenta cadastrada</p>
        </Card>
      )}
    </div>
  );
}
