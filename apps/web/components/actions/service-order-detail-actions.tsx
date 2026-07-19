"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

type PartOption = {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
  available: number;
};

type Props = {
  orderId: string;
  orderNumber: number;
  status: string;
  role: string;
  canEditLines: boolean;
  canTransition: boolean;
  quoteSentAt: string | null;
  quoteRejectedAt: string | null;
  lineCount: number;
  parts: PartOption[];
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  APPROVED: "Aprovada",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
  INVOICED: "Faturada",
  CANCELLED: "Cancelada",
};

export function ServiceOrderDetailActions({
  orderId,
  orderNumber,
  status,
  role,
  canEditLines,
  canTransition,
  quoteSentAt,
  quoteRejectedAt,
  lineCount,
  parts,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partId, setPartId] = useState(parts[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [rejectNotes, setRejectNotes] = useState("");

  const selectedPart = parts.find((p) => p.id === partId);
  const isManager = role === "ADMIN" || role === "MANAGER";
  const quotePending = status === "DRAFT" && !!quoteSentAt;
  const quoteDraft = status === "DRAFT" && !quoteSentAt;

  async function addPartLine(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPart) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/service-orders/${orderId}/lines`, {
        method: "POST",
        body: JSON.stringify({
          type: "PART",
          partId: selectedPart.id,
          description: selectedPart.name,
          quantity: Number(quantity),
          unitPrice: selectedPart.unitPrice,
        }),
      });
      setQuantity("1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar peça");
    } finally {
      setLoading(false);
    }
  }

  async function transitionTo(nextStatus: string, notes?: string) {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/service-orders/${orderId}/transition`, {
        method: "POST",
        body: JSON.stringify({ status: nextStatus, notes }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na transição");
    } finally {
      setLoading(false);
    }
  }

  async function quoteAction(action: "send" | "approve" | "reject") {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/service-orders/${orderId}/quote`, {
        method: "POST",
        body: JSON.stringify({
          action,
          notes: action === "reject" ? rejectNotes || undefined : undefined,
        }),
      });
      setRejectNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no orçamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
        <span className="text-sm font-medium">Orçamento #{orderNumber}</span>
        <Link
          href={`/workshop/service-orders/${orderId}/orcamento`}
          target="_blank"
          className="text-sm text-accent underline-offset-2 hover:underline"
        >
          Ver / imprimir PDF
        </Link>
        {quotePending && (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
            Aguardando aprovação
          </span>
        )}
        {quoteRejectedAt && quoteDraft && (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-800 dark:text-red-200">
            Reprovado — pode editar
          </span>
        )}
      </div>

      {isManager && status === "DRAFT" && (
        <div className="flex flex-wrap gap-2">
          {quoteDraft && (
            <Button
              type="button"
              disabled={loading || lineCount === 0}
              onClick={() => quoteAction("send")}
              title={lineCount === 0 ? "Adicione itens antes de enviar" : undefined}
            >
              Enviar orçamento ao cliente
            </Button>
          )}
          {quotePending && (
            <>
              <Button type="button" disabled={loading} onClick={() => quoteAction("approve")}>
                Cliente aprovou orçamento
              </Button>
              <Button type="button" variant="secondary" disabled={loading} onClick={() => quoteAction("reject")}>
                Reprovar orçamento
              </Button>
            </>
          )}
        </div>
      )}

      {quotePending && isManager && (
        <label className="block text-sm">
          Motivo da reprovação (opcional)
          <input
            className="mt-1 w-full max-w-md rounded-lg border border-border bg-background px-3 py-2"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Ex.: cliente pediu revisão de valores"
          />
        </label>
      )}

      {canEditLines && parts.length > 0 && (
        <form onSubmit={addPartLine} className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-4">
          <label className="block text-sm">
            Peça
            <select
              className="mt-1 block min-w-[200px] rounded-lg border border-border bg-background px-3 py-2"
              value={partId}
              onChange={(e) => setPartId(e.target.value)}
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} (disp. {p.available})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Qtd
            <input
              type="number"
              min={1}
              step={1}
              className="mt-1 w-20 rounded-lg border border-border bg-background px-3 py-2"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <Button
            type="submit"
            disabled={loading || !selectedPart || (selectedPart?.available ?? 0) < Number(quantity)}
          >
            Reservar peça na OS
          </Button>
        </form>
      )}

      {canEditLines && parts.length === 0 && (
        <p className="text-sm text-muted-foreground">Cadastre peças no estoque para adicionar à OS.</p>
      )}

      {canTransition && (
        <div className="flex flex-wrap gap-2">
          {status === "APPROVED" && isManager && (
            <>
              <Button type="button" disabled={loading} onClick={() => transitionTo("IN_PROGRESS", "Serviço iniciado")}>
                Iniciar serviço
              </Button>
              <Button type="button" variant="secondary" disabled={loading} onClick={() => transitionTo("CANCELLED")}>
                Cancelar
              </Button>
            </>
          )}
          {status === "IN_PROGRESS" && (
            <>
              <Button type="button" disabled={loading} onClick={() => transitionTo("DONE", "Serviço concluído")}>
                Concluir (baixa estoque)
              </Button>
              {isManager && (
                <Button type="button" variant="secondary" disabled={loading} onClick={() => transitionTo("CANCELLED")}>
                  Cancelar
                </Button>
              )}
            </>
          )}
          {status === "DONE" && isManager && (
            <Button type="button" disabled={loading} onClick={() => transitionTo("INVOICED", "Faturada")}>
              Marcar como faturada
            </Button>
          )}
          {(quoteDraft || quotePending) && isManager && status === "DRAFT" && (
            <Button type="button" variant="secondary" disabled={loading} onClick={() => transitionTo("CANCELLED")}>
              Cancelar OS
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Status: <strong>{STATUS_LABELS[status] ?? status}</strong>
        {quotePending && " — orçamento enviado, aguardando resposta do cliente."}
        {status === "CANCELLED" && " — reservas liberadas."}
        {status === "DONE" && " — estoque consumido."}
      </p>
    </div>
  );
}
