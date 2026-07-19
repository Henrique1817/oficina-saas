import { inventoryRepository } from "@/server/modules/inventory/inventory.repository";
import { Card } from "@/components/ui/card";
import { AddPartButton } from "@/components/actions/add-part-button";
import { EditPartButton } from "@/components/actions/edit-part-button";
import { StockInButton } from "@/components/actions/stock-in-button";
import { getSessionOrRedirect } from "@/lib/session";

export default async function PartsPage() {
  const { organizationId } = await getSessionOrRedirect();
  const [{ data: parts }, locations] = await Promise.all([
    inventoryRepository.listParts(organizationId, { limit: 50 }),
    inventoryRepository.listLocations(organizationId),
  ]);

  const locationOptions = locations.map((l) => ({ id: l.id, name: l.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Estoque e Peças</h1>
        <AddPartButton />
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2">SKU</th>
              <th className="pb-2">Nome</th>
              <th className="pb-2">Disponível</th>
              <th className="pb-2">Mín.</th>
              <th className="pb-2">Preço</th>
              <th className="pb-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => {
              const available = p.stockItems.reduce((s, i) => s + i.quantity - i.reservedQty, 0);
              const low = available <= p.minQuantity;
              return (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="py-3 font-mono text-xs">{p.sku}</td>
                  <td className="py-3">{p.name}</td>
                  <td className={`py-3 ${low ? "font-medium text-danger" : ""}`}>{available}</td>
                  <td className="py-3">{p.minQuantity}</td>
                  <td className="py-3">
                    {Number(p.unitPrice).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      <EditPartButton part={p} />
                      <StockInButton partId={p.id} locations={locationOptions} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
