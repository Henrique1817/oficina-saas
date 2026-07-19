import { prisma } from "@oficina/database";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AddCustomerButton } from "@/components/actions/add-customer-button";
import { AddVehicleButton } from "@/components/actions/add-vehicle-button";
import { getSessionOrRedirect } from "@/lib/session";

export default async function CustomersPage() {
  const { organizationId } = await getSessionOrRedirect();
  const customers = await prisma.customer.findMany({
    where: { organizationId },
    take: 50,
    orderBy: { name: "asc" },
    include: {
      vehicles: { orderBy: { createdAt: "desc" } },
      _count: { select: { serviceOrders: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cadastros"
        title="Clientes"
        description="Ficha completa: veículos, histórico de OS e peças usadas."
        actions={<AddCustomerButton />}
      />
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="mono-label px-6 pb-3 pt-5 text-ink-mute">Cliente</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Telefone</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Veículos</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">OS</th>
                <th className="mono-label px-6 pb-3 pt-5 text-right text-ink-mute">Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-line/60 align-top">
                  <td className="px-6 py-4">
                    <Link
                      href={`/manager/customers/${c.id}`}
                      className="font-medium text-ink hover:text-signal hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-ink-dim">{c.phone ?? "—"}</td>
                  <td className="max-w-md px-3 py-4">
                    {c.vehicles.length === 0 ? (
                      <span className="text-ink-mute">Nenhum veículo</span>
                    ) : (
                      <ul className="space-y-2 text-xs">
                        {c.vehicles.slice(0, 3).map((v) => (
                          <li key={v.id} className="border border-line bg-bg/60 px-3 py-2">
                            <span className="font-[family-name:var(--font-mono)] font-medium text-signal">
                              {v.plate}
                            </span>
                            {" · "}
                            <span className="text-ink-dim">{v.vehicleModel}</span>
                            {v.vehicleYear != null ? ` · ${v.vehicleYear}` : ""}
                          </li>
                        ))}
                        {c.vehicles.length > 3 && (
                          <li className="text-ink-mute">+{c.vehicles.length - 3} veículos</li>
                        )}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-4 text-ink-dim">{c._count.serviceOrders}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/manager/customers/${c.id}`}
                        className="text-xs text-signal underline-offset-2 hover:underline"
                      >
                        Ver ficha
                      </Link>
                      <AddVehicleButton customerId={c.id} customerName={c.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <p className="py-10 text-center text-ink-mute">Nenhum cliente cadastrado</p>
        )}
      </Card>
    </div>
  );
}
