"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type PartRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitCost: number | { toString(): string };
  unitPrice: number | { toString(): string };
  minQuantity: number;
};

export function EditPartButton({ part }: { part: PartRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sku, setSku] = useState(part.sku);
  const [name, setName] = useState(part.name);
  const [description, setDescription] = useState(part.description ?? "");
  const [unitCost, setUnitCost] = useState(String(Number(part.unitCost)));
  const [unitPrice, setUnitPrice] = useState(String(Number(part.unitPrice)));
  const [minQuantity, setMinQuantity] = useState(String(part.minQuantity));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/parts/${part.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          sku,
          name,
          description: description || undefined,
          unitCost: Number(unitCost),
          unitPrice: Number(unitPrice),
          minQuantity: Number(minQuantity) || 0,
        }),
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Editar
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className="absolute inset-0"
            role="presentation"
            onClick={() => !loading && setOpen(false)}
          />
          <form
            onSubmit={submit}
            className="relative z-10 max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto border border-line bg-bg-panel p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold">Editar peça</h2>
            {error && <p className="text-sm text-danger">{error}</p>}
            <input
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SKU"
            />
            <input
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome"
            />
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={0}
                step="0.01"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="Custo"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Preço"
              />
            </div>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              placeholder="Estoque mínimo"
            />
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="secondary" disabled={loading} onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
