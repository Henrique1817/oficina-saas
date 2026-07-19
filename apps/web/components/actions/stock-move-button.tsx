"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type Location = { id: string; name: string };
type MoveType = "IN" | "OUT" | "ADJUSTMENT";

const LABELS: Record<MoveType, string> = {
  IN: "Entrada",
  OUT: "Saída",
  ADJUSTMENT: "Ajuste",
};

export function StockMoveButton({
  partId,
  partLabel,
  locations,
  allowAdjustment = false,
  defaultType = "IN",
  triggerLabel,
}: {
  partId: string;
  partLabel?: string;
  locations: Location[];
  allowAdjustment?: boolean;
  defaultType?: MoveType;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<MoveType>(defaultType);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  if (!locations.length) return null;

  const types: MoveType[] = allowAdjustment
    ? ["IN", "OUT", "ADJUSTMENT"]
    : ["IN", "OUT"];

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
          type,
          quantity: Number(quantity),
          notes: notes.trim() || undefined,
        }),
      });
      setOpen(false);
      setQuantity("1");
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no movimento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {triggerLabel ?? (defaultType === "OUT" ? "Saída" : "+ Estoque")}
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
            className="relative z-10 w-full max-w-sm space-y-3 border border-line bg-bg-panel p-6"
          >
            <h2 className="font-semibold">Movimento de estoque</h2>
            {partLabel && <p className="text-sm text-ink-dim">{partLabel}</p>}
            {error && <p className="text-sm text-alert">{error}</p>}

            <div className="flex flex-wrap gap-1">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`mono-label border px-3 py-1.5 ${
                    type === t
                      ? "border-signal/40 bg-signal/10 text-signal"
                      : "border-line text-ink-mute hover:border-line-strong"
                  }`}
                >
                  {LABELS[t]}
                </button>
              ))}
            </div>

            <label className="block space-y-1 text-sm">
              <span className="mono-label text-ink-mute">Local</span>
              <select
                className="w-full border border-line bg-bg px-3 py-2 text-sm text-ink"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="mono-label text-ink-mute">
                {type === "ADJUSTMENT" ? "Quantidade absoluta" : "Quantidade"}
              </span>
              <input
                type="number"
                min={type === "ADJUSTMENT" ? 0 : 1}
                required
                className="w-full border border-line bg-bg px-3 py-2 text-sm text-ink"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="mono-label text-ink-mute">Obs. (opcional)</span>
              <input
                className="w-full border border-line bg-bg px-3 py-2 text-sm text-ink"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="NF, motivo…"
                maxLength={500}
              />
            </label>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Confirmar"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

/** Compat: entrada rápida nas linhas antigas */
export function StockInButton({
  partId,
  locations,
}: {
  partId: string;
  locations: Location[];
}) {
  return (
    <StockMoveButton partId={partId} locations={locations} defaultType="IN" />
  );
}
