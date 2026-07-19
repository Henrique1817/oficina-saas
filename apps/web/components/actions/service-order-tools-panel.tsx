"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type ToolRow = {
  id: string;
  assetCode: string;
  name: string;
  status: string;
  checkouts: { id: string }[];
};

type ActiveCheckout = {
  id: string;
  tool: { id: string; name: string; assetCode: string };
  checkedOutBy: { fullName: string };
  checkedOutAt?: string;
  createdAt?: string;
};

type Props = {
  orderId: string;
  canManage: boolean;
  activeCheckouts: ActiveCheckout[];
};

export function ServiceOrderToolsPanel({ orderId, canManage, activeCheckouts }: Props) {
  const router = useRouter();
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [toolId, setToolId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<ToolRow[]>("/api/v1/tools");
        if (!cancelled) {
          const available = (Array.isArray(list) ? list : []).filter(
            (t) => t.status === "AVAILABLE",
          );
          setTools(available);
          setToolId(available[0]?.id ?? "");
        }
      } catch {
        if (!cancelled) setTools([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCheckouts.length]);

  const selected = useMemo(() => tools.find((t) => t.id === toolId), [tools, toolId]);

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (!toolId) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/v1/tools/checkout", {
        method: "POST",
        body: JSON.stringify({
          toolId,
          serviceOrderId: orderId,
          notes: notes.trim() || undefined,
        }),
      });
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao retirar ferramenta");
    } finally {
      setLoading(false);
    }
  }

  async function returnTool(checkoutId: string) {
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/v1/tools/return", {
        method: "POST",
        body: JSON.stringify({ checkoutId }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao devolver ferramenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-alert">{error}</p>}

      <ul className="space-y-0 font-[family-name:var(--font-mono)] text-[0.75rem]">
        {activeCheckouts.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-line bg-bg/70 px-4 py-3"
          >
            <div>
              <span className="text-signal">{c.tool.assetCode}</span>
              <span className="text-ink-dim"> · {c.tool.name}</span>
              <span className="mt-1 block text-ink-mute">Com {c.checkedOutBy.fullName}</span>
            </div>
            {canManage && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={loading}
                onClick={() => void returnTool(c.id)}
              >
                Devolver
              </Button>
            )}
          </li>
        ))}
        {activeCheckouts.length === 0 && (
          <li className="border border-line px-4 py-6 text-ink-mute">
            Nenhuma ferramenta vinculada a esta OS
          </li>
        )}
      </ul>

      {canManage && (
        <form
          onSubmit={checkout}
          className="flex flex-wrap items-end gap-3 border border-line p-4"
        >
          <p className="w-full mono-label text-signal">Retirar ferramenta para esta OS</p>
          <div className="min-w-[220px] flex-1">
            <label htmlFor="os-tool">Ferramenta disponível</label>
            <select
              id="os-tool"
              value={toolId}
              onChange={(e) => setToolId(e.target.value)}
              disabled={tools.length === 0}
            >
              {tools.length === 0 && <option value="">Nenhuma disponível</option>}
              {tools.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.assetCode} — {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label htmlFor="os-tool-notes">Nota (opcional)</label>
            <input
              id="os-tool-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: bancada 2"
            />
          </div>
          <Button type="submit" disabled={loading || !selected}>
            Retirar
          </Button>
        </form>
      )}
    </div>
  );
}
