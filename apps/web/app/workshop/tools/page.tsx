import { toolRepository } from "@/server/modules/tools/tool.repository";
import { Card } from "@/components/ui/card";
import { getSessionOrRedirect } from "@/lib/session";

export default async function ToolsPage() {
  const { organizationId } = await getSessionOrRedirect();
  const tools = await toolRepository.list(organizationId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ferramentas</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => {
          const checkout = t.checkouts[0];
          return (
            <Card key={t.id}>
              <p className="font-mono text-xs text-muted-foreground">{t.assetCode}</p>
              <p className="mt-1 font-semibold">{t.name}</p>
              <p
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
                  t.status === "AVAILABLE"
                    ? "bg-success/20 text-success"
                    : t.status === "IN_USE"
                      ? "bg-accent/20 text-accent"
                      : "bg-danger/20 text-danger"
                }`}
              >
                {t.status}
              </p>
              {checkout && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Em uso: {checkout.checkedOutBy.fullName}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
