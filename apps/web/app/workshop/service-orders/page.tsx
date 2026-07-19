import Link from "next/link";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";
import { Card } from "@/components/ui/card";
import { getSessionOrRedirect, canManageServiceOrders } from "@/lib/session";
import { NewServiceOrderButton } from "@/components/actions/new-service-order-button";

export default async function ServiceOrdersPage() {
  const { organizationId, profile, role } = await getSessionOrRedirect();
  const { data: orders } = await serviceOrderRepository.list(organizationId, {
    limit: 50,
    ...(role === "MECHANIC" ? { mechanicId: profile.id } : {}),
  });

  const canCreateOs = canManageServiceOrders(role);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        {canCreateOs && <NewServiceOrderButton />}
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2">#</th>
              <th className="pb-2">Cliente</th>
              <th className="pb-2">Placa / Veículo</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Mecânico</th>
              <th className="pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border/50">
                <td className="py-3">
                  <Link href={`/workshop/service-orders/${o.id}`} className="text-primary hover:underline">
                    #{o.orderNumber}
                  </Link>
                </td>
                <td className="py-3">{o.customer.name}</td>
                <td className="py-3">
                  <span className="font-mono">{o.vehicle.plate}</span>
                  <span className="block text-xs text-muted-foreground">
                    {o.vehicle.vehicleModel}
                    {o.vehicle.vehicleYear != null ? ` · ${o.vehicle.vehicleYear}` : ""}
                  </span>
                </td>
                <td className="py-3">{o.status}</td>
                <td className="py-3">{o.assignedMechanic?.fullName ?? "—"}</td>
                <td className="py-3">R$ {Number(o.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
