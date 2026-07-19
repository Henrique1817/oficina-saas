import Link from "next/link";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSessionOrRedirect, canManageServiceOrders } from "@/lib/session";
import { NewServiceOrderButton } from "@/components/actions/new-service-order-button";
import { cn } from "@/lib/utils";

const DUE_LABELS = {
  today: "Prazo hoje",
  overdue: "Atrasadas",
} as const;

export default async function ServiceOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ due?: string; mechanicId?: string }>;
}) {
  const params = await searchParams;
  const due =
    params.due === "today" || params.due === "overdue" ? params.due : undefined;

  const { organizationId, profile, role } = await getSessionOrRedirect();
  const { data: orders } = await serviceOrderRepository.list(organizationId, {
    limit: 50,
    due,
    ...(role === "MECHANIC"
      ? { mechanicId: profile.id }
      : params.mechanicId
        ? { mechanicId: params.mechanicId }
        : {}),
  });

  const canCreateOs = canManageServiceOrders(role);
  const now = Date.now();

  const title = due ? DUE_LABELS[due] : "Ordens de serviço";
  const description = due
    ? "Filtro da agenda operacional — prazos em America/Sao_Paulo."
    : "Do rascunho ao faturado — linhas, mão de obra e WhatsApp.";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="02 · OS + orçamento"
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-2">
            {due && (
              <Link
                href="/workshop/service-orders"
                className="inline-flex h-8 items-center border border-line-strong px-3 text-xs text-ink-dim hover:border-signal hover:text-signal"
              >
                Limpar filtro
              </Link>
            )}
            {canCreateOs && <NewServiceOrderButton />}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/workshop/service-orders"
          className={cn(
            "mono-label border px-3 py-1.5",
            !due
              ? "border-signal/40 bg-signal/10 text-signal"
              : "border-line text-ink-mute hover:border-line-strong",
          )}
        >
          Todas
        </Link>
        <Link
          href="/workshop/service-orders?due=today"
          className={cn(
            "mono-label border px-3 py-1.5",
            due === "today"
              ? "border-signal/40 bg-signal/10 text-signal"
              : "border-line text-ink-mute hover:border-line-strong",
          )}
        >
          Prazo hoje
        </Link>
        <Link
          href="/workshop/service-orders?due=overdue"
          className={cn(
            "mono-label border px-3 py-1.5",
            due === "overdue"
              ? "border-alert/40 bg-alert/10 text-alert"
              : "border-line text-ink-mute hover:border-line-strong",
          )}
        >
          Atrasadas
        </Link>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="mono-label px-6 pb-3 pt-5 text-ink-mute">#</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Cliente</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Placa / Veículo</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Status</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Prazo</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Mecânico</th>
                <th className="mono-label px-6 pb-3 pt-5 text-ink-mute">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const overdue =
                  o.dueAt &&
                  !["DONE", "INVOICED", "CANCELLED"].includes(o.status) &&
                  o.dueAt.getTime() < now;
                return (
                  <tr key={o.id} className="border-b border-line/60">
                    <td className="px-6 py-4">
                      <Link
                        href={`/workshop/service-orders/${o.id}`}
                        className="font-[family-name:var(--font-mono)] text-signal hover:underline"
                      >
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-4 text-ink">{o.customer.name}</td>
                    <td className="px-3 py-4">
                      <span className="font-[family-name:var(--font-mono)] text-ink-dim">
                        {o.vehicle.plate}
                      </span>
                      <span className="block text-xs text-ink-mute">
                        {o.vehicle.vehicleModel}
                        {o.vehicle.vehicleYear != null ? ` · ${o.vehicle.vehicleYear}` : ""}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="mono-label text-ok">{o.status}</span>
                    </td>
                    <td className="px-3 py-4">
                      {o.dueAt ? (
                        <span
                          className={cn(
                            "font-[family-name:var(--font-mono)] text-xs",
                            overdue ? "text-alert" : "text-ink-dim",
                          )}
                        >
                          {o.dueAt.toLocaleString("pt-BR", {
                            timeZone: "America/Sao_Paulo",
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                          {overdue ? " · atrasado" : ""}
                        </span>
                      ) : (
                        <span className="text-ink-mute">—</span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-ink-dim">
                      {o.assignedMechanic?.fullName ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-ink-dim">
                      R$ {Number(o.total).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <p className="py-10 text-center text-ink-mute">Nenhuma ordem de serviço</p>
        )}
      </Card>
    </div>
  );
}
