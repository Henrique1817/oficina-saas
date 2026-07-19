import Link from "next/link";
import { Card, StatCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { userRepository } from "@/server/modules/users/user.repository";
import { toolRepository } from "@/server/modules/tools/tool.repository";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";
import { DashboardQuickActions } from "@/components/dashboard-quick-actions";
import { getSessionOrRedirect, canManageServiceOrders } from "@/lib/session";
import { cn } from "@/lib/utils";

function formatDue(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDayLabel(ymd: string) {
  const [y, m, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, day, 12));
  return utc.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export default async function WorkshopDashboardPage() {
  const { organizationId, role, profile } = await getSessionOrRedirect();
  const mechanicOnly = role === "MECHANIC" ? { mechanicId: profile.id } : undefined;

  const [stats, toolsInUse, agenda] = await Promise.all([
    userRepository.getDashboardStats(organizationId),
    toolRepository.toolsInUse(organizationId),
    serviceOrderRepository.getAgenda(organizationId, mechanicOnly),
  ]);

  const cards = [
    {
      label: "Prazo hoje",
      value: agenda.counts.dueToday,
      hot: agenda.counts.dueToday > 0,
      href: "/workshop/service-orders?due=today",
    },
    {
      label: "Atrasadas",
      value: agenda.counts.overdue,
      hot: agenda.counts.overdue > 0,
      href: "/workshop/service-orders?due=overdue",
    },
    {
      label: "Em execução / aprovadas",
      value: agenda.counts.inProgress,
      href: "/workshop/service-orders",
    },
    {
      label: "Estoque baixo",
      value: stats.lowStock,
      hot: stats.lowStock > 0,
      href: "/manager/parts?lowStock=1",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="01 · Operação"
        title="Agenda do dia"
        description={`${formatDayLabel(agenda.day)} — prazos, atrasos e quem está com cada OS.`}
      />

      <DashboardQuickActions canCreateServiceOrders={canManageServiceOrders(role)} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="block transition hover:opacity-90">
            <StatCard label={c.label} value={c.value} hot={c.hot} />
          </Link>
        ))}
      </div>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="mono-label text-alert">Atrasadas</h2>
            <Link
              href="/workshop/service-orders?due=overdue"
              className="text-xs text-ink-mute underline-offset-4 hover:text-ink hover:underline"
            >
              Ver lista
            </Link>
          </div>
          <ul className="space-y-0 font-[family-name:var(--font-mono)] text-[0.75rem]">
            {agenda.overdue.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/workshop/service-orders/${o.id}`}
                  className="flex items-center justify-between border border-line bg-bg/70 px-4 py-3 transition hover:border-alert/50"
                >
                  <span className="text-ink-dim">
                    #{o.orderNumber} — {o.customer.name}{" "}
                    <span className="text-ink-mute">({o.vehicle.plate})</span>
                  </span>
                  <span className="text-alert">{formatDue(o.dueAt)}</span>
                </Link>
              </li>
            ))}
            {agenda.overdue.length === 0 && (
              <li className="border border-line px-4 py-6 text-ink-mute">Nenhuma OS atrasada</li>
            )}
          </ul>
        </Card>

        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="mono-label text-signal">Prazo hoje</h2>
            <Link
              href="/workshop/service-orders?due=today"
              className="text-xs text-ink-mute underline-offset-4 hover:text-ink hover:underline"
            >
              Ver lista
            </Link>
          </div>
          <ul className="space-y-0 font-[family-name:var(--font-mono)] text-[0.75rem]">
            {agenda.dueToday.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/workshop/service-orders/${o.id}`}
                  className="flex items-center justify-between border border-line bg-bg/70 px-4 py-3 transition hover:border-signal/50"
                >
                  <span className="text-ink-dim">
                    #{o.orderNumber} — {o.customer.name}{" "}
                    <span className="text-ink-mute">({o.vehicle.plate})</span>
                  </span>
                  <span className="text-signal">{formatDue(o.dueAt)}</span>
                </Link>
              </li>
            ))}
            {agenda.dueToday.length === 0 && (
              <li className="border border-line px-4 py-6 text-ink-mute">
                Nenhum prazo para hoje
              </li>
            )}
          </ul>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="mono-label text-ok">Quadro por mecânico</h2>
          <span className="text-xs text-ink-mute">Aprovadas + em andamento</span>
        </div>
        {agenda.byMechanic.length === 0 ? (
          <Card>
            <p className="text-center text-ink-mute">Nenhuma OS em execução no momento</p>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {agenda.byMechanic.map((col) => (
              <Card key={col.mechanicId ?? "unassigned"} className="bg-bg/40">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <p className="font-semibold tracking-tight text-ink">{col.mechanicName}</p>
                  <span className="mono-label text-ink-mute">{col.orders.length}</span>
                </div>
                <ul className="space-y-2">
                  {col.orders.map((o) => {
                    const overdue = o.dueAt && o.dueAt.getTime() < Date.now();
                    return (
                      <li key={o.id}>
                        <Link
                          href={`/workshop/service-orders/${o.id}`}
                          className="block border border-line bg-bg/70 px-3 py-2 transition hover:border-signal/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-[family-name:var(--font-mono)] text-xs text-signal">
                              #{o.orderNumber}
                            </span>
                            <span className="mono-label text-[0.6rem] text-ok">{o.status}</span>
                          </div>
                          <p className="mt-1 text-sm text-ink-dim">
                            {o.customer.name} · {o.vehicle.plate}
                          </p>
                          <p
                            className={cn(
                              "mt-1 font-[family-name:var(--font-mono)] text-[0.65rem]",
                              overdue ? "text-alert" : "text-ink-mute",
                            )}
                          >
                            Prazo: {formatDue(o.dueAt)}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="mono-label text-ink-mute">Ferramentas em uso</h2>
            <Link
              href="/workshop/tools"
              className="text-xs text-ink-mute underline-offset-4 hover:text-ink hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <ul className="space-y-0 font-[family-name:var(--font-mono)] text-[0.75rem]">
            {toolsInUse.slice(0, 8).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between border border-line bg-bg/70 px-4 py-3"
              >
                <span className="text-ink-dim">{c.tool.name}</span>
                <span className="text-ink-mute">
                  {c.serviceOrder ? (
                    <Link
                      href={`/workshop/service-orders/${c.serviceOrder.id}`}
                      className="text-signal hover:underline"
                    >
                      OS #{c.serviceOrder.orderNumber}
                    </Link>
                  ) : (
                    c.checkedOutBy.fullName
                  )}
                </span>
              </li>
            ))}
            {toolsInUse.length === 0 && (
              <li className="border border-line px-4 py-6 text-ink-mute">
                Nenhuma ferramenta em uso
              </li>
            )}
          </ul>
        </Card>
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="mono-label text-ink-mute">Resumo</h2>
          </div>
          <ul className="space-y-0 font-[family-name:var(--font-mono)] text-[0.75rem]">
            <li className="flex justify-between border border-line bg-bg/70 px-4 py-3 text-ink-dim">
              <span>OS abertas (todas)</span>
              <span className="text-signal">{stats.openOrders}</span>
            </li>
            <li className="flex justify-between border border-line bg-bg/70 px-4 py-3 text-ink-dim">
              <span>Ferramentas fora</span>
              <span>{stats.toolsInUse}</span>
            </li>
            <li className="flex justify-between border border-line bg-bg/70 px-4 py-3 text-ink-dim">
              <span>Clientes</span>
              <span>{stats.customers}</span>
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
