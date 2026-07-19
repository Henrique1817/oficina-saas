import Link from "next/link";
import { notFound } from "next/navigation";
import { customerRepository } from "@/server/modules/customers/customer.repository";
import { Card, StatCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AddVehicleButton } from "@/components/actions/add-vehicle-button";
import { buttonVariants } from "@/components/ui/button";
import { getSessionOrRedirect, canManageServiceOrders } from "@/lib/session";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  APPROVED: "Aprovada",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
  INVOICED: "Faturada",
  CANCELLED: "Cancelada",
};

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId, role } = await getSessionOrRedirect();
  const profile = await customerRepository.getProfile(organizationId, id);
  if (!profile) notFound();

  const canCreateOs = canManageServiceOrders(role);
  const now = Date.now();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Ficha do cliente"
        title={profile.name}
        description={
          [profile.phone, profile.email, profile.document].filter(Boolean).join(" · ") ||
          "Sem contato cadastrado"
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/manager/customers"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
            >
              ← Clientes
            </Link>
            <AddVehicleButton customerId={profile.id} customerName={profile.name} />
            {canCreateOs && (
              <Link
                href={`/workshop/service-orders/new?customerId=${profile.id}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Nova OS
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Veículos" value={profile.stats.vehicleCount} />
        <StatCard label="OS no total" value={profile.stats.orderCount} />
        <StatCard
          label="OS abertas"
          value={profile.stats.openOrders}
          hot={profile.stats.openOrders > 0}
        />
        <StatCard
          label="Já faturou / concluiu"
          value={money(profile.stats.lifetimeSpend)}
          hot={profile.stats.lifetimeSpend > 0}
        />
      </div>

      {profile.notes && (
        <Card>
          <p className="mono-label text-ink-mute">Notas</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-dim">{profile.notes}</p>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="mono-label text-signal">Veículos</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {profile.vehicles.map((v) => (
            <Card key={v.id} className="bg-bg/50">
              <p className="font-[family-name:var(--font-mono)] text-lg font-medium text-signal">
                {v.plate}
              </p>
              <p className="mt-1 text-ink">
                {v.vehicleModel}
                {v.vehicleYear != null ? ` · ${v.vehicleYear}` : ""}
                {v.color ? ` · ${v.color}` : ""}
              </p>
              {v.reportedIssue && (
                <p className="mt-3 text-sm text-ink-mute line-clamp-3">
                  Último problema: {v.reportedIssue}
                </p>
              )}
              {canCreateOs && (
                <Link
                  href={`/workshop/service-orders/new?customerId=${profile.id}&vehicleId=${v.id}`}
                  className="mt-4 inline-block text-xs text-signal underline-offset-2 hover:underline"
                >
                  Abrir OS neste veículo
                </Link>
              )}
            </Card>
          ))}
        </div>
        {profile.vehicles.length === 0 && (
          <Card>
            <p className="text-center text-ink-mute">Nenhum veículo cadastrado</p>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="mono-label text-ok">Histórico de OS</h2>
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="mono-label px-6 pb-3 pt-5 text-ink-mute">#</th>
                  <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Data</th>
                  <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Veículo</th>
                  <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Status</th>
                  <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Prazo</th>
                  <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Mecânico</th>
                  <th className="mono-label px-6 pb-3 pt-5 text-ink-mute">Total</th>
                </tr>
              </thead>
              <tbody>
                {profile.serviceOrders.map((o) => {
                  const overdue =
                    o.dueAt &&
                    !["DONE", "INVOICED", "CANCELLED"].includes(o.status) &&
                    o.dueAt.getTime() < now;
                  return (
                    <tr key={o.id} className="border-b border-line/60 align-top">
                      <td className="px-6 py-4">
                        <Link
                          href={`/workshop/service-orders/${o.id}`}
                          className="font-[family-name:var(--font-mono)] text-signal hover:underline"
                        >
                          #{o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-ink-dim">
                        {o.openedAt.toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-3 py-4">
                        <span className="font-[family-name:var(--font-mono)] text-ink-dim">
                          {o.vehicle.plate}
                        </span>
                        <span className="block text-xs text-ink-mute">
                          {o.vehicle.vehicleModel}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className="mono-label text-ok">
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
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
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        ) : (
                          <span className="text-ink-mute">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-ink-dim">
                        {o.assignedMechanic?.fullName ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-ink-dim">{money(Number(o.total))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {profile.serviceOrders.length === 0 && (
            <p className="py-10 text-center text-ink-mute">Nenhuma OS neste cliente</p>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="mono-label text-ink-mute">Peças recentes nestas OS</h2>
        <Card>
          {profile.recentParts.length === 0 ? (
            <p className="text-sm text-ink-mute">Ainda sem peças lançadas no histórico.</p>
          ) : (
            <ul className="space-y-0 font-[family-name:var(--font-mono)] text-[0.75rem]">
              {profile.recentParts.map((line, i) => (
                <li
                  key={`${line.serviceOrder.id}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-2 border border-line bg-bg/70 px-4 py-3 text-ink-dim"
                >
                  <span>
                    {line.part?.sku ? `${line.part.sku} · ` : ""}
                    {line.part?.name ?? line.description}
                  </span>
                  <Link
                    href={`/workshop/service-orders/${line.serviceOrder.id}`}
                    className="text-signal hover:underline"
                  >
                    OS #{line.serviceOrder.orderNumber}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
