import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@oficina/database";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";
import { userRepository } from "@/server/modules/users/user.repository";
import { Card, StatCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ServiceOrderDetailActions } from "@/components/actions/service-order-detail-actions";
import { ServiceOrderToolsPanel } from "@/components/actions/service-order-tools-panel";
import { getSessionOrRedirect } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function ServiceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId, profile, role } = await getSessionOrRedirect();
  const order = await serviceOrderRepository.getById(organizationId, id);
  if (!order) notFound();

  const [partsRaw, team] = await Promise.all([
    prisma.part.findMany({
      where: { organizationId, active: true },
      include: { stockItems: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    role === "MECHANIC" ? Promise.resolve([]) : userRepository.list(organizationId),
  ]);

  const parts = partsRaw.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    unitPrice: Number(p.unitPrice),
    available: p.stockItems.reduce((s, i) => s + i.quantity - i.reservedQty, 0),
  }));

  const quoteLocked = order.status === "DRAFT" && !!order.quoteSentAt;
  const canEditLines = order.status === "DRAFT" && !quoteLocked;
  const canEditHeader =
    (role === "ADMIN" || role === "MANAGER") &&
    ["DRAFT", "APPROVED", "IN_PROGRESS"].includes(order.status) &&
    !(order.status === "DRAFT" && quoteLocked);
  const canTransition = !["CANCELLED", "INVOICED"].includes(order.status);
  const mechanicBlocked =
    role === "MECHANIC" && order.assignedMechanicId !== profile.id;
  const canManageTools =
    !mechanicBlocked && ["APPROVED", "IN_PROGRESS"].includes(order.status);
  const showToolsSection =
    canManageTools || order.toolCheckouts.length > 0;

  const dueOverdue =
    order.dueAt &&
    !["DONE", "INVOICED", "CANCELLED"].includes(order.status) &&
    order.dueAt.getTime() < Date.now();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Status · ${order.status}`}
        title={`OS #${order.orderNumber}`}
        description={
          <>
            <Link
              href={`/manager/customers/${order.customerId}`}
              className="text-signal hover:underline"
            >
              {order.customer.name}
            </Link>
            {` · ${order.vehicle.plate}`}
          </>
        }
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="border border-line bg-bg-panel px-3 py-1.5 text-ink-dim">
          Mecânico:{" "}
          <strong className="text-ink">
            {order.assignedMechanic?.fullName ?? "Não atribuído"}
          </strong>
        </span>
        <span
          className={cn(
            "border px-3 py-1.5",
            dueOverdue
              ? "border-alert/40 bg-alert/10 text-alert"
              : "border-line bg-bg-panel text-ink-dim",
          )}
        >
          Prazo:{" "}
          <strong>
            {order.dueAt
              ? order.dueAt.toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "Sem prazo"}
          </strong>
          {dueOverdue ? " · atrasado" : ""}
        </span>
        {order.workAuthorizedAt && (
          <span className="border border-ok/40 bg-ok/10 px-3 py-1.5 text-ok">
            Autorizado: <strong>{order.workAuthorizedBy}</strong>
          </span>
        )}
      </div>

      {!mechanicBlocked && (canEditLines || canEditHeader || canTransition) && (
        <Card>
          <h2 className="mb-4 mono-label text-signal">Ações</h2>
          <ServiceOrderDetailActions
            orderId={order.id}
            orderNumber={order.orderNumber}
            status={order.status}
            role={role}
            canEditLines={canEditLines}
            canEditHeader={canEditHeader}
            canTransition={canTransition}
            quoteSentAt={order.quoteSentAt?.toISOString() ?? null}
            quoteRejectedAt={order.quoteRejectedAt?.toISOString() ?? null}
            lineCount={order.lines.length}
            laborCount={order.laborEntries.length}
            parts={parts}
            team={team}
            assignedMechanicId={order.assignedMechanicId}
            dueAt={order.dueAt?.toISOString() ?? null}
            description={order.description}
            internalNotes={order.internalNotes}
            discount={Number(order.discount)}
            customerName={order.customer.name}
            workAuthorizedAt={order.workAuthorizedAt?.toISOString() ?? null}
            workAuthorizedBy={order.workAuthorizedBy}
          />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 mono-label text-ink-mute">Veículo</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="mono-label text-ink-mute">Placa</dt>
            <dd className="mt-1 font-[family-name:var(--font-mono)] font-medium text-signal">
              {order.vehicle.plate}
            </dd>
          </div>
          <div>
            <dt className="mono-label text-ink-mute">Modelo</dt>
            <dd className="mt-1 text-ink">{order.vehicle.vehicleModel}</dd>
          </div>
          <div>
            <dt className="mono-label text-ink-mute">Ano</dt>
            <dd className="mt-1 text-ink-dim">{order.vehicle.vehicleYear ?? "—"}</dd>
          </div>
          <div>
            <dt className="mono-label text-ink-mute">Cor</dt>
            <dd className="mt-1 text-ink-dim">{order.vehicle.color ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="mono-label text-ink-mute">Problema apresentado</dt>
            <dd className="mt-1 whitespace-pre-wrap text-ink-dim">
              {order.vehicle.reportedIssue ?? "—"}
            </dd>
          </div>
          {order.description && (
            <div className="sm:col-span-2">
              <dt className="mono-label text-ink-mute">Descrição da OS</dt>
              <dd className="mt-1 whitespace-pre-wrap text-ink-dim">{order.description}</dd>
            </div>
          )}
          {order.internalNotes && (
            <div className="sm:col-span-2">
              <dt className="mono-label text-ink-mute">Notas internas</dt>
              <dd className="mt-1 whitespace-pre-wrap text-ink-mute">{order.internalNotes}</dd>
            </div>
          )}
        </dl>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Peças / serviços" value={`R$ ${Number(order.partsTotal).toFixed(2)}`} />
        <StatCard label="Mão de obra" value={`R$ ${Number(order.laborTotal).toFixed(2)}`} />
        <StatCard
          label="Desconto"
          value={`R$ ${Number(order.discount).toFixed(2)}`}
          hot={Number(order.discount) > 0}
        />
        <StatCard label="Total" value={`R$ ${Number(order.total).toFixed(2)}`} hot />
      </div>

      <Card>
        <h2 className="mb-4 mono-label text-signal">Linhas</h2>
        <ul className="space-y-0 font-[family-name:var(--font-mono)] text-[0.75rem]">
          {order.lines.map((l) => (
            <li
              key={l.id}
              className="flex justify-between border border-line bg-bg/70 px-4 py-3 text-ink-dim"
            >
              <span>
                [{l.type}] {l.description} ×{Number(l.quantity)}
                {l.type === "PART" && l.part && (
                  <span className="ml-2 text-ink-mute">({l.part.sku})</span>
                )}
              </span>
              <span className="text-ink">R$ {Number(l.total).toFixed(2)}</span>
            </li>
          ))}
          {order.lines.length === 0 && (
            <li className="border border-line px-4 py-6 text-ink-mute">Nenhuma linha</li>
          )}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-4 mono-label text-ok">Mão de obra</h2>
        <ul className="space-y-0 font-[family-name:var(--font-mono)] text-[0.75rem]">
          {order.laborEntries.map((l) => (
            <li
              key={l.id}
              className="flex justify-between border border-line bg-bg/70 px-4 py-3 text-ink-dim"
            >
              <span>
                {l.description} · {l.minutes} min · {l.mechanic.fullName}
              </span>
              <span className="text-ink">R$ {Number(l.total).toFixed(2)}</span>
            </li>
          ))}
          {order.laborEntries.length === 0 && (
            <li className="border border-line px-4 py-6 text-ink-mute">
              Nenhuma mão de obra lançada
            </li>
          )}
        </ul>
      </Card>

      {showToolsSection && (
        <Card>
          <h2 className="mb-4 mono-label text-signal">Ferramentas nesta OS</h2>
          {!canManageTools && order.toolCheckouts.length > 0 && (
            <p className="mb-3 text-xs text-ink-mute">
              Retirada/devolução só em OS aprovada ou em andamento.
            </p>
          )}
          <ServiceOrderToolsPanel
            orderId={order.id}
            canManage={canManageTools}
            activeCheckouts={order.toolCheckouts.map((c) => ({
              id: c.id,
              tool: c.tool,
              checkedOutBy: c.checkedOutBy,
              checkedOutAt: c.checkedOutAt.toISOString(),
            }))}
          />
        </Card>
      )}

      <Card>
        <h2 className="mb-4 mono-label text-ink-mute">Histórico de status</h2>
        <ul className="space-y-1 text-sm text-ink-mute">
          {order.statusHistory.map((h) => (
            <li key={h.id}>
              {h.fromStatus ?? "—"} → {h.toStatus} (
              {new Date(h.createdAt).toLocaleString("pt-BR")})
              {h.notes ? ` — ${h.notes}` : ""}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
