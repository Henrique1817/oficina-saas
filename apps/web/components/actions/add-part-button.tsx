"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type Props = {
  variant?: "default" | "secondary";
  className?: string;
};

export function AddPartButton({ variant = "default", className }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitCost, setUnitCost] = useState("0");
  const [unitPrice, setUnitPrice] = useState("0");
  const [minQuantity, setMinQuantity] = useState("0");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/v1/parts", {
        method: "POST",
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
      setSku("");
      setName("");
      setDescription("");
      setUnitCost("0");
      setUnitPrice("0");
      setMinQuantity("0");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant={variant} className={className} onClick={() => setOpen(true)}>
        Nova peça
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
            className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 className="mb-4 text-lg font-semibold">Cadastrar peça</h2>
            {error && <p className="mb-3 text-sm text-danger">{error}</p>}
            <label className="mb-2 block text-sm">
              SKU *
              <input
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </label>
            <label className="mb-2 block text-sm">
              Nome *
              <input
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="mb-2 block text-sm">
              Descrição
              <textarea
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <label className="block text-sm">
                Custo unit.
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Preço venda
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </label>
            </div>
            <label className="mb-4 block text-sm">
              Estoque mínimo
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" disabled={loading} onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
