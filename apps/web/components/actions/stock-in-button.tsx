"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type Location = { id: string; name: string };

export function StockInButton({
  partId,
  locations,
}: {
  partId: string;
  locations: Location[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");

  if (!locations.length) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/v1/inventory/movements", {
        method: "POST",
        body: JSON.stringify({
          partId,
          locationId,
          type: "IN",
          quantity: Number(quantity),
        }),
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na entrada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        + Estoque
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="absolute inset-0" role="presentation" onClick={() => !loading && setOpen(false)} />
          <form
            onSubmit={submit}
            className="relative z-10 w-full max-w-sm space-y-3 rounded-xl border border-border bg-card p-6"
          >
            <h2 className="font-semibold">Entrada de estoque</h2>
            {error && <p className="text-sm text-danger">{error}</p>}
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Confirmar"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
