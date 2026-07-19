import { prisma } from "@oficina/database";
import { Card } from "@/components/ui/card";
import { userRepository } from "@/server/modules/users/user.repository";
import { toolRepository } from "@/server/modules/tools/tool.repository";
import { DashboardQuickActions } from "@/components/dashboard-quick-actions";
import { getSessionOrRedirect, canManageServiceOrders } from "@/lib/session";

export default async function WorkshopDashboardPage() {
  const { organizationId, role } = await getSessionOrRedirect();
  const [stats, toolsInUse, recentOrders] = await Promise.all([
    userRepository.getDashboardStats(organizationId),
    toolRepository.toolsInUse(organizationId),
    prisma.serviceOrder.findMany({
      where: {
        organizationId,
        status: { in: ["DRAFT", "APPROVED", "IN_PROGRESS"] },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        vehicle: { select: { plate: true } },
      },
    }),
  ]);

  const cards = [
    { label: "OS abertas", value: stats.openOrders },
    { label: "Estoque baixo", value: stats.lowStock },
    { label: "Ferramentas em uso", value: stats.toolsInUse },
    { label: "Clientes", value: stats.customers },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <DashboardQuickActions canCreateServiceOrders={canManageServiceOrders(role)} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.value}</p>
          </Card>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">OS recentes</h2>
          <ul className="space-y-2 text-sm">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex justify-between border-b border-border pb-2">
                <span>
                  #{o.orderNumber} — {o.customer.name} ({o.vehicle.plate})
                </span>
                <span className="text-muted-foreground">{o.status}</span>
              </li>
            ))}
            {recentOrders.length === 0 && (
              <li className="text-muted-foreground">Nenhuma OS aberta</li>
            )}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Ferramentas em uso</h2>
          <ul className="space-y-2 text-sm">
            {toolsInUse.map((c) => (
              <li key={c.id} className="flex justify-between border-b border-border pb-2">
                <span>{c.tool.name}</span>
                <span className="text-muted-foreground">{c.checkedOutBy.fullName}</span>
              </li>
            ))}
            {toolsInUse.length === 0 && (
              <li className="text-muted-foreground">Nenhuma ferramenta em uso</li>
            )}
          </ul>
        </Card>
      </section>
    </div>
  );
}
