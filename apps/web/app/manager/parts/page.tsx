import Link from "next/link";
import { inventoryRepository } from "@/server/modules/inventory/inventory.repository";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AddPartButton } from "@/components/actions/add-part-button";
import { EditPartButton } from "@/components/actions/edit-part-button";
import { StockMoveButton } from "@/components/actions/stock-move-button";
import { QuickStockPanel } from "@/components/actions/quick-stock-panel";
import { getSessionOrRedirect } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lowStock?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const lowStock = params.lowStock === "1" || params.lowStock === "true";

  const { organizationId, role } = await getSessionOrRedirect();
  const allowAdjustment = role === "ADMIN" || role === "MANAGER";

  const [{ data: parts }, locations, allLow] = await Promise.all([
    inventoryRepository.listParts(organizationId, {
      limit: 100,
      q,
      lowStock: lowStock || undefined,
    }),
    inventoryRepository.listLocations(organizationId),
    inventoryRepository.getLowStockParts(organizationId),
  ]);

  const locationOptions = locations.map((l) => ({ id: l.id, name: l.name }));
  const lowCount = allLow.length;

  const filterHref = (next: { q?: string; lowStock?: boolean }) => {
    const sp = new URLSearchParams();
    const qq = next.q !== undefined ? next.q : q;
    if (qq) sp.set("q", qq);
    if (next.lowStock) sp.set("lowStock", "1");
    const s = sp.toString();
    return s ? `/manager/parts?${s}` : "/manager/parts";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="03 · Estoque"
        title="Peça na OS, estoque atualizado"
        description="Busca rápida, alerta de mínimo e movimento de entrada/saída no ritmo do chão."
        actions={<AddPartButton />}
      />

      {lowCount > 0 && !lowStock && (
        <Link
          href="/manager/parts?lowStock=1"
          className="block border border-alert/40 bg-alert/5 px-4 py-3 text-sm text-ink transition hover:border-alert"
        >
          <span className="font-semibold text-alert">{lowCount}</span>
          {" peça(s) no ou abaixo do mínimo — "}
          <span className="text-signal underline-offset-2 hover:underline">ver só estoque baixo</span>
        </Link>
      )}

      <QuickStockPanel locations={locationOptions} allowAdjustment={allowAdjustment} />

      <form className="flex flex-wrap items-end gap-2" action="/manager/parts" method="get">
        {lowStock && <input type="hidden" name="lowStock" value="1" />}
        <label className="min-w-[200px] flex-1 space-y-1 text-sm">
          <span className="mono-label text-ink-mute">Filtrar lista</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="SKU ou nome"
            className="w-full border border-line bg-bg px-3 py-2 text-sm text-ink"
          />
        </label>
        <button
          type="submit"
          className="h-10 border border-line-strong bg-transparent px-4 text-sm font-semibold text-ink hover:border-signal hover:text-signal"
        >
          Buscar
        </button>
        {(q || lowStock) && (
          <Link
            href="/manager/parts"
            className="inline-flex h-10 items-center border border-line px-3 text-xs text-ink-dim hover:border-signal hover:text-signal"
          >
            Limpar
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={filterHref({ lowStock: false })}
          className={cn(
            "mono-label border px-3 py-1.5",
            !lowStock
              ? "border-signal/40 bg-signal/10 text-signal"
              : "border-line text-ink-mute hover:border-line-strong",
          )}
        >
          Todas
        </Link>
        <Link
          href={filterHref({ lowStock: true })}
          className={cn(
            "mono-label border px-3 py-1.5",
            lowStock
              ? "border-alert/50 bg-alert/10 text-alert"
              : "border-line text-ink-mute hover:border-line-strong",
          )}
        >
          Estoque baixo{lowCount > 0 ? ` (${lowCount})` : ""}
        </Link>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="mono-label px-6 pb-3 pt-5 text-ink-mute">SKU</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Nome</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Disp.</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Reserv.</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Mín.</th>
                <th className="mono-label px-3 pb-3 pt-5 text-ink-mute">Preço</th>
                <th className="mono-label px-6 pb-3 pt-5 text-ink-mute">Ações</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => {
                const available = p.stockItems.reduce(
                  (s, i) => s + i.quantity - i.reservedQty,
                  0,
                );
                const reserved = p.stockItems.reduce((s, i) => s + i.reservedQty, 0);
                const low = available <= p.minQuantity;
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "border-b border-line/60",
                      low && "bg-alert/[0.04]",
                    )}
                  >
                    <td className="px-6 py-4 font-[family-name:var(--font-mono)] text-xs text-ink-dim">
                      {p.sku}
                    </td>
                    <td className="px-3 py-4 text-ink">
                      {p.name}
                      {low && (
                        <span className="ml-2 mono-label text-alert">baixo</span>
                      )}
                    </td>
                    <td
                      className={`px-3 py-4 ${low ? "font-semibold text-alert" : "text-ink-dim"}`}
                    >
                      {available}
                    </td>
                    <td className="px-3 py-4 text-ink-mute">{reserved || "—"}</td>
                    <td className="px-3 py-4 text-ink-mute">{p.minQuantity}</td>
                    <td className="px-3 py-4 text-ink-dim">
                      {Number(p.unitPrice).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <EditPartButton part={p} />
                        <StockMoveButton
                          partId={p.id}
                          partLabel={`${p.sku} — ${p.name}`}
                          locations={locationOptions}
                          allowAdjustment={allowAdjustment}
                          defaultType="IN"
                          triggerLabel="Mov."
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {parts.length === 0 && (
          <p className="py-10 text-center text-ink-mute">
            {q || lowStock ? "Nenhuma peça neste filtro" : "Nenhuma peça cadastrada"}
          </p>
        )}
      </Card>
    </div>
  );
}
