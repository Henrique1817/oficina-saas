import { notFound } from "next/navigation";
import { prisma } from "@oficina/database";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";
import { Card } from "@/components/ui/card";
import { ServiceOrderDetailActions } from "@/components/actions/service-order-detail-actions";
import { getSessionOrRedirect } from "@/lib/session";

const LINE_EDIT_STATUSES = ["DRAFT", "APPROVED", "IN_PROGRESS"];

export default async function ServiceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId, profile, role } = await getSessionOrRedirect();
  const order = await serviceOrderRepository.getById(organizationId, id);
  if (!order) notFound();

  const partsRaw = await prisma.part.findMany({
    where: { organizationId, active: true },
    include: { stockItems: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  const parts = partsRaw.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    unitPrice: Number(p.unitPrice),
    available: p.stockItems.reduce((s, i) => s + i.quantity - i.reservedQty, 0),
  }));

  const quoteLocked = order.status === "DRAFT" && !!order.quoteSentAt;
  const canEditLines =
    order.status === "DRAFT" && !quoteLocked && LINE_EDIT_STATUSES.includes(order.status);
  const canTransition = !["CANCELLED", "INVOICED"].includes(order.status);
  const mechanicBlocked =
    role === "MECHANIC" && order.assignedMechanicId !== profile.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OS #{order.orderNumber}</h1>
        <p className="text-muted-foreground">
          {order.customer.name} — {order.status}
        </p>
      </div>

      {!mechanicBlocked && (canEditLines || canTransition) && (
        <Card>
          <h2 className="mb-4 font-semibold">Ações</h2>
          <ServiceOrderDetailActions
            orderId={order.id}
            orderNumber={order.orderNumber}
            status={order.status}
            role={role}
            canEditLines={canEditLines}
            canTransition={canTransition}
            quoteSentAt={order.quoteSentAt?.toISOString() ?? null}
            quoteRejectedAt={order.quoteRejectedAt?.toISOString() ?? null}
            lineCount={order.lines.length}
            parts={parts}
          />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-semibold">Veículo</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Placa</dt>
            <dd className="font-mono font-medium">{order.vehicle.plate}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Modelo</dt>
            <dd>{order.vehicle.vehicleModel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Ano</dt>
            <dd>{order.vehicle.vehicleYear ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Cor</dt>
            <dd>{order.vehicle.color ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Problema apresentado</dt>
            <dd className="whitespace-pre-wrap">{order.vehicle.reportedIssue ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted-foreground">Peças</p>
          <p className="text-xl font-bold">R$ {Number(order.partsTotal).toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Mão de obra</p>
          <p className="text-xl font-bold">R$ {Number(order.laborTotal).toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-xl font-bold">R$ {Number(order.total).toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Linhas</h2>
        <ul className="space-y-2 text-sm">
          {order.lines.map((l) => (
            <li key={l.id} className="flex justify-between">
              <span>
                [{l.type}] {l.description} x{Number(l.quantity)}
                {l.type === "PART" && l.part && (
                  <span className="ml-2 text-muted-foreground">({l.part.sku})</span>
                )}
              </span>
              <span>R$ {Number(l.total).toFixed(2)}</span>
            </li>
          ))}
          {order.lines.length === 0 && (
            <li className="text-muted-foreground">Nenhuma linha cadastrada</li>
          )}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Histórico de status</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {order.statusHistory.map((h) => (
            <li key={h.id}>
              {h.fromStatus ?? "—"} → {h.toStatus} ({new Date(h.createdAt).toLocaleString("pt-BR")})
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
