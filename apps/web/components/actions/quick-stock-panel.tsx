"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { Card } from "@/components/ui/card";

type Location = { id: string; name: string };

type PartHit = {
  id: string;
  sku: string;
  name: string;
  minQuantity: number;
  stockItems: { quantity: number; reservedQty: number; location: { id: string; name: string } }[];
};

type PartsResponse = {
  data: PartHit[];
  nextCursor: string | null;
  hasMore: boolean;
};

export function QuickStockPanel({
  locations,
  allowAdjustment = false,
}: {
  locations: Location[];
  allowAdjustment?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim());
  const [hits, setHits] = useState<PartHit[]>([]);
  const [selected, setSelected] = useState<PartHit | null>(null);
  const [type, setType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    if (deferred.length < 1) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    apiFetch<PartsResponse>(`/api/v1/parts?q=${encodeURIComponent(deferred)}&limit=8`)
      .then((res) => {
        if (!cancelled) setHits(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deferred]);

  function pick(part: PartHit) {
    setSelected(part);
    setQuery(`${part.sku} — ${part.name}`);
    setHits([]);
    const firstWithStock = part.stockItems.find((s) => s.quantity > 0);
    if (firstWithStock) setLocationId(firstWithStock.location.id);
  }

  function available(part: PartHit) {
    return part.stockItems.reduce((s, i) => s + i.quantity - i.reservedQty, 0);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Busque e selecione uma peça");
      return;
    }
    setLoading(true);
    setError(null);
    setOkMsg(null);
    try {
      await apiFetch("/api/v1/inventory/movements", {
        method: "POST",
        body: JSON.stringify({
          partId: selected.id,
          locationId,
          type,
          quantity: Number(quantity),
          notes: notes.trim() || undefined,
        }),
      });
      setOkMsg(`${type === "OUT" ? "Saída" : type === "IN" ? "Entrada" : "Ajuste"} registrado`);
      setQuantity("1");
      setNotes("");
      setSelected(null);
      setQuery("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no movimento");
    } finally {
      setLoading(false);
    }
  }

  if (!locations.length) {
    return (
      <Card className="border-alert/40 bg-alert/5 p-4 text-sm text-ink-dim">
        Cadastre um local de estoque antes de registrar movimentos.
      </Card>
    );
  }

  const types = allowAdjustment
    ? (["IN", "OUT", "ADJUSTMENT"] as const)
    : (["IN", "OUT"] as const);

  return (
    <Card className="space-y-4 p-5">
      <div>
        <p className="mono-label text-signal">Movimento rápido</p>
        <h2 className="mt-1 text-lg font-semibold text-ink">Buscar SKU ou nome</h2>
        <p className="mt-1 text-sm text-ink-mute">
          Digite, confirme o item e registre entrada ou saída sem abrir a linha.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="relative">
          <input
            className="w-full border border-line bg-bg px-3 py-2.5 text-sm text-ink"
            placeholder="Ex.: pastilha, FIL-001…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setOkMsg(null);
            }}
            autoComplete="off"
          />
          {(hits.length > 0 || searching) && !selected && deferred.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto border border-line bg-bg-panel shadow-lg">
              {searching && hits.length === 0 && (
                <li className="px-3 py-2 text-sm text-ink-mute">Buscando…</li>
              )}
              {hits.map((p) => {
                const avail = available(p);
                const low = avail <= p.minQuantity;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-bg-soft"
                      onClick={() => pick(p)}
                    >
                      <span>
                        <span className="font-[family-name:var(--font-mono)] text-xs text-ink-dim">
                          {p.sku}
                        </span>
                        <span className="ml-2 text-ink">{p.name}</span>
                      </span>
                      <span className={low ? "font-semibold text-alert" : "text-ink-mute"}>
                        {avail} disp.
                      </span>
                    </button>
                  </li>
                );
              })}
              {!searching && hits.length === 0 && (
                <li className="px-3 py-2 text-sm text-ink-mute">Nenhuma peça</li>
              )}
            </ul>
          )}
        </div>

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
              {t === "IN" ? "Entrada" : t === "OUT" ? "Saída" : "Ajuste"}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1 text-sm sm:col-span-1">
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
              {type === "ADJUSTMENT" ? "Qtd. absoluta" : "Quantidade"}
            </span>
            <input
              type="number"
              min={type === "ADJUSTMENT" ? 0 : 1}
              required
              className="w-full border border-line bg-bg px-3 py-2 text-sm text-ink"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="mono-label text-ink-mute">Obs.</span>
            <input
              className="w-full border border-line bg-bg px-3 py-2 text-sm text-ink"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
              maxLength={500}
            />
          </label>
        </div>

        {selected && (
          <p className="text-xs text-ink-dim">
            Selecionado:{" "}
            <span className="font-[family-name:var(--font-mono)] text-signal">{selected.sku}</span>{" "}
            · {available(selected)} disponível
            {available(selected) <= selected.minQuantity ? " · estoque baixo" : ""}
          </p>
        )}

        {error && <p className="text-sm text-alert">{error}</p>}
        {okMsg && <p className="text-sm text-ok">{okMsg}</p>}

        <Button type="submit" disabled={loading || !selected}>
          {loading ? "Registrando..." : "Registrar movimento"}
        </Button>
      </form>
    </Card>
  );
}
