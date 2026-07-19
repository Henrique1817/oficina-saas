import { prisma } from "@oficina/database";
import { Card } from "@/components/ui/card";
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
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <AddCustomerButton />
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2">Cliente</th>
                <th className="pb-2">Telefone</th>
                <th className="pb-2">Veículos</th>
                <th className="pb-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border/50 align-top">
                  <td className="py-3 font-medium">{c.name}</td>
                  <td className="py-3">{c.phone ?? "—"}</td>
                  <td className="max-w-md py-3">
                    {c.vehicles.length === 0 ? (
                      <span className="text-muted-foreground">Nenhum veículo</span>
                    ) : (
                      <ul className="space-y-2 text-xs">
                        {c.vehicles.map((v) => (
                          <li key={v.id} className="rounded-md bg-muted/40 px-2 py-1.5">
                            <span className="font-mono font-medium">{v.plate}</span>
                            {" · "}
                            <span>{v.vehicleModel}</span>
                            {v.vehicleYear != null ? ` · ${v.vehicleYear}` : ""}
                            {v.color ? ` · ${v.color}` : ""}
                            {v.reportedIssue ? (
                              <span className="mt-0.5 block text-muted-foreground line-clamp-2">
                                Problema: {v.reportedIssue}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <AddVehicleButton customerId={c.id} customerName={c.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">Nenhum cliente cadastrado</p>
        )}
      </Card>
    </div>
  );
}
