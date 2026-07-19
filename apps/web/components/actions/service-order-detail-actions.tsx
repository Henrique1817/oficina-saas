"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type PartOption = {
  id: string;
  sku: string;
  name: string;
  unitPrice: number;
  available: number;
};

type TeamMember = {
  id: string;
  fullName: string;
  role: string;
  active: boolean;
};

type Props = {
  orderId: string;
  orderNumber: number;
  status: string;
  role: string;
  canEditLines: boolean;
  canEditHeader: boolean;
  canTransition: boolean;
  quoteSentAt: string | null;
  quoteRejectedAt: string | null;
  lineCount: number;
  laborCount: number;
  parts: PartOption[];
  team: TeamMember[];
  assignedMechanicId: string | null;
  dueAt: string | null;
  description: string | null;
  internalNotes: string | null;
  discount: number;
  customerName: string;
  workAuthorizedAt: string | null;
  workAuthorizedBy: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  APPROVED: "Aprovada",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
  INVOICED: "Faturada",
  CANCELLED: "Cancelada",
};

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ServiceOrderDetailActions({
  orderId,
  orderNumber,
  status,
  role,
  canEditLines,
  canEditHeader,
  canTransition,
  quoteSentAt,
  quoteRejectedAt,
  lineCount,
  laborCount,
  parts,
  team,
  assignedMechanicId,
  dueAt,
  description,
  internalNotes,
  discount,
  customerName,
  workAuthorizedAt,
  workAuthorizedBy,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [partId, setPartId] = useState(parts[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");

  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceQty, setServiceQty] = useState("1");
  const [servicePrice, setServicePrice] = useState("");

  const [laborDesc, setLaborDesc] = useState("");
  const [laborMinutes, setLaborMinutes] = useState("60");
  const [laborRate, setLaborRate] = useState("80");
  const [laborMechanicId, setLaborMechanicId] = useState(
    assignedMechanicId ?? team.find((t) => t.active)?.id ?? "",
  );

  const [headerMechanicId, setHeaderMechanicId] = useState(assignedMechanicId ?? "");
  const [headerDueAt, setHeaderDueAt] = useState(toDatetimeLocalValue(dueAt));
  const [headerDescription, setHeaderDescription] = useState(description ?? "");
  const [headerNotes, setHeaderNotes] = useState(internalNotes ?? "");
  const [headerDiscount, setHeaderDiscount] = useState(String(discount));

  const [rejectNotes, setRejectNotes] = useState("");
  const [authSignedBy, setAuthSignedBy] = useState(customerName);
  const [authNotes, setAuthNotes] = useState("");

  const selectedPart = parts.find((p) => p.id === partId);
  const isManager = role === "ADMIN" || role === "MANAGER";
  const quotePending = status === "DRAFT" && !!quoteSentAt;
  const quoteDraft = status === "DRAFT" && !quoteSentAt;

  const mechanics = useMemo(
    () => team.filter((u) => u.active && ["MECHANIC", "MANAGER", "ADMIN"].includes(u.role)),
    [team],
  );

  const hasItems = lineCount > 0 || laborCount > 0;
  const checklist = [
    { id: "mechanic", label: "Mecânico atribuído", ok: Boolean(assignedMechanicId || headerMechanicId) },
    { id: "due", label: "Prazo definido", ok: Boolean(dueAt || headerDueAt) },
    { id: "items", label: "Peça, serviço ou mão de obra", ok: hasItems },
  ];
  const checklistReady = checklist.every((c) => c.ok);

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

  async function addServiceLine(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceDesc.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/service-orders/${orderId}/lines`, {
        method: "POST",
        body: JSON.stringify({
          type: "SERVICE",
          description: serviceDesc.trim(),
          quantity: Number(serviceQty) || 1,
          unitPrice: Number(servicePrice) || 0,
        }),
      });
      setServiceDesc("");
      setServiceQty("1");
      setServicePrice("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar serviço");
    } finally {
      setLoading(false);
    }
  }

  async function addLabor(e: React.FormEvent) {
    e.preventDefault();
    if (!laborMechanicId || !laborDesc.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/service-orders/${orderId}/labor`, {
        method: "POST",
        body: JSON.stringify({
          mechanicId: laborMechanicId,
          description: laborDesc.trim(),
          minutes: Number(laborMinutes) || 60,
          hourlyRate: Number(laborRate) || 0,
        }),
      });
      setLaborDesc("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar mão de obra");
    } finally {
      setLoading(false);
    }
  }

  async function saveHeader(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/service-orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({
          assignedMechanicId: headerMechanicId || null,
          dueAt: headerDueAt ? new Date(headerDueAt).toISOString() : null,
          description: headerDescription.trim() || null,
          internalNotes: headerNotes.trim() || null,
          discount: Number(headerDiscount) || 0,
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar cabeçalho");
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

  async function authorizeWork(method: "digital" | "print") {
    if (!authSignedBy.trim()) {
      setError("Informe o nome de quem autorizou");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/service-orders/${orderId}/authorize`, {
        method: "POST",
        body: JSON.stringify({
          signedBy: authSignedBy.trim(),
          notes: authNotes.trim() || undefined,
          method,
        }),
      });
      setAuthNotes("");
      router.refresh();
      if (method === "print") {
        window.open(`/workshop/service-orders/${orderId}/autorizacao`, "_blank");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar autorização");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-alert">{error}</p>}

      {status === "DRAFT" && quoteDraft && (
        <div className="border border-line bg-bg/50 p-4">
          <p className="mono-label text-signal">Checklist do orçamento</p>
          <ul className="mt-3 space-y-2">
            {checklist.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center justify-between border border-line px-3 py-2 text-sm",
                  item.ok ? "text-ok" : "text-ink-mute",
                )}
              >
                <span>{item.label}</span>
                <span className="mono-label">{item.ok ? "OK" : "PENDENTE"}</span>
              </li>
            ))}
          </ul>
          {!checklistReady && (
            <p className="mt-3 text-xs text-ink-mute">
              Complete os itens para enviar um orçamento mais claro ao cliente.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border border-line bg-bg-soft p-3">
        <span className="text-sm font-medium text-ink">Orçamento #{orderNumber}</span>
        <Link
          href={`/workshop/service-orders/${orderId}/orcamento`}
          target="_blank"
          className="text-sm text-signal underline-offset-2 hover:underline"
        >
          Ver / imprimir PDF
        </Link>
        <Link
          href={`/workshop/service-orders/${orderId}/autorizacao`}
          target="_blank"
          className="text-sm text-signal underline-offset-2 hover:underline"
        >
          Autorização / contrato
        </Link>
        {quotePending && (
          <span className="border border-signal/40 bg-signal/10 px-2 py-0.5 mono-label text-signal">
            Aguardando aprovação
          </span>
        )}
        {quoteRejectedAt && quoteDraft && (
          <span className="border border-alert/40 bg-alert/10 px-2 py-0.5 mono-label text-alert">
            Reprovado — pode editar
          </span>
        )}
        {workAuthorizedAt && (
          <span className="border border-ok/40 bg-ok/10 px-2 py-0.5 mono-label text-ok">
            Autorizado{workAuthorizedBy ? ` · ${workAuthorizedBy}` : ""}
          </span>
        )}
      </div>

      {isManager && status !== "CANCELLED" && hasItems && (
        <div className="space-y-3 border border-line p-4">
          <p className="mono-label text-ok">Autorização de serviço</p>
          {workAuthorizedAt ? (
            <p className="text-sm text-ink-dim">
              Já autorizado em{" "}
              {new Date(workAuthorizedAt).toLocaleString("pt-BR")}
              {workAuthorizedBy ? ` por ${workAuthorizedBy}` : ""}. Você pode registrar de novo
              ou imprimir o termo.
            </p>
          ) : (
            <p className="text-sm text-ink-mute">
              Registre o aceite digital do cliente ou imprima o termo para assinatura.
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="auth-signed-by">Nome de quem autoriza</label>
              <input
                id="auth-signed-by"
                value={authSignedBy}
                onChange={(e) => setAuthSignedBy(e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
            <div>
              <label htmlFor="auth-notes">Observação (opcional)</label>
              <input
                id="auth-notes"
                value={authNotes}
                onChange={(e) => setAuthNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={loading || !authSignedBy.trim()}
              onClick={() => void authorizeWork("digital")}
            >
              Registrar aceite digital
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || !authSignedBy.trim()}
              onClick={() => void authorizeWork("print")}
            >
              Registrar e imprimir
            </Button>
            <Link
              href={`/workshop/service-orders/${orderId}/autorizacao`}
              target="_blank"
              className="inline-flex h-10 items-center border border-line-strong px-4 text-sm text-ink-dim hover:border-signal hover:text-signal"
            >
              Só abrir termo
            </Link>
          </div>
        </div>
      )}

      {canEditHeader && (
        <form onSubmit={saveHeader} className="space-y-3 border border-line p-4">
          <p className="mono-label text-ink-mute">Cabeçalho da OS</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="hdr-mechanic">Mecânico</label>
              <select
                id="hdr-mechanic"
                value={headerMechanicId}
                onChange={(e) => setHeaderMechanicId(e.target.value)}
              >
                <option value="">Sem atribuição</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="hdr-due">Prazo</label>
              <input
                id="hdr-due"
                type="datetime-local"
                value={headerDueAt}
                onChange={(e) => setHeaderDueAt(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="hdr-desc">Descrição</label>
            <textarea
              id="hdr-desc"
              rows={2}
              value={headerDescription}
              onChange={(e) => setHeaderDescription(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="hdr-notes">Notas internas</label>
            <textarea
              id="hdr-notes"
              rows={2}
              value={headerNotes}
              onChange={(e) => setHeaderNotes(e.target.value)}
            />
          </div>
          <div className="max-w-xs">
            <label htmlFor="hdr-discount">Desconto (R$)</label>
            <input
              id="hdr-discount"
              type="number"
              min={0}
              step="0.01"
              value={headerDiscount}
              onChange={(e) => setHeaderDiscount(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            Salvar cabeçalho
          </Button>
        </form>
      )}

      {isManager && status === "DRAFT" && (
        <div className="flex flex-wrap gap-2">
          {quoteDraft && (
            <Button
              type="button"
              disabled={loading || !hasItems}
              onClick={() => quoteAction("send")}
              title={!hasItems ? "Adicione itens ou mão de obra antes de enviar" : undefined}
            >
              Enviar orçamento ao cliente
            </Button>
          )}
          {quotePending && (
            <>
              <Button type="button" disabled={loading} onClick={() => quoteAction("approve")}>
                Cliente aprovou orçamento
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => quoteAction("reject")}
              >
                Reprovar orçamento
              </Button>
            </>
          )}
        </div>
      )}

      {quotePending && isManager && (
        <div>
          <label htmlFor="reject-notes">Motivo da reprovação (opcional)</label>
          <input
            id="reject-notes"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Ex.: cliente pediu revisão de valores"
          />
        </div>
      )}

      {canEditLines && (
        <div className="space-y-4">
          <form
            onSubmit={addPartLine}
            className="flex flex-wrap items-end gap-3 border border-line p-4"
          >
            <p className="w-full mono-label text-signal">Peça do estoque</p>
            <div className="min-w-[220px] flex-1">
              <label htmlFor="part-select">Peça</label>
              <select
                id="part-select"
                value={partId}
                onChange={(e) => setPartId(e.target.value)}
                disabled={parts.length === 0}
              >
                {parts.length === 0 && <option value="">Cadastre peças no estoque</option>}
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name} (disp. {p.available})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label htmlFor="part-qty">Qtd</label>
              <input
                id="part-qty"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={
                loading || !selectedPart || (selectedPart?.available ?? 0) < Number(quantity)
              }
            >
              Reservar peça
            </Button>
          </form>

          <form
            onSubmit={addServiceLine}
            className="flex flex-wrap items-end gap-3 border border-line p-4"
          >
            <p className="w-full mono-label text-ok">Serviço avulso</p>
            <div className="min-w-[200px] flex-1">
              <label htmlFor="svc-desc">Descrição</label>
              <input
                id="svc-desc"
                required
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="Ex.: Alinhamento"
              />
            </div>
            <div className="w-24">
              <label htmlFor="svc-qty">Qtd</label>
              <input
                id="svc-qty"
                type="number"
                min={0.01}
                step="0.01"
                value={serviceQty}
                onChange={(e) => setServiceQty(e.target.value)}
              />
            </div>
            <div className="w-32">
              <label htmlFor="svc-price">Preço un.</label>
              <input
                id="svc-price"
                type="number"
                min={0}
                step="0.01"
                value={servicePrice}
                onChange={(e) => setServicePrice(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading || !serviceDesc.trim()}>
              Adicionar serviço
            </Button>
          </form>

          <form
            onSubmit={addLabor}
            className="flex flex-wrap items-end gap-3 border border-line p-4"
          >
            <p className="w-full mono-label text-ink-dim">Mão de obra</p>
            <div className="min-w-[180px]">
              <label htmlFor="labor-mech">Mecânico</label>
              <select
                id="labor-mech"
                required
                value={laborMechanicId}
                onChange={(e) => setLaborMechanicId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px] flex-1">
              <label htmlFor="labor-desc">Descrição</label>
              <input
                id="labor-desc"
                required
                value={laborDesc}
                onChange={(e) => setLaborDesc(e.target.value)}
                placeholder="Ex.: Troca de pastilhas"
              />
            </div>
            <div className="w-28">
              <label htmlFor="labor-min">Minutos</label>
              <input
                id="labor-min"
                type="number"
                min={1}
                step={1}
                value={laborMinutes}
                onChange={(e) => setLaborMinutes(e.target.value)}
              />
            </div>
            <div className="w-32">
              <label htmlFor="labor-rate">R$/hora</label>
              <input
                id="labor-rate"
                type="number"
                min={0}
                step="0.01"
                value={laborRate}
                onChange={(e) => setLaborRate(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading || !laborMechanicId || !laborDesc.trim()}>
              Lançar mão de obra
            </Button>
          </form>
        </div>
      )}

      {canTransition && (
        <div className="flex flex-wrap gap-2">
          {status === "APPROVED" && isManager && (
            <>
              <Button
                type="button"
                disabled={loading}
                onClick={() => transitionTo("IN_PROGRESS", "Serviço iniciado")}
              >
                Iniciar serviço
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => transitionTo("CANCELLED")}
              >
                Cancelar
              </Button>
            </>
          )}
          {status === "IN_PROGRESS" && (
            <>
              <Button
                type="button"
                disabled={loading}
                onClick={() => transitionTo("DONE", "Serviço concluído")}
              >
                Concluir (baixa estoque)
              </Button>
              {isManager && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => transitionTo("CANCELLED")}
                >
                  Cancelar
                </Button>
              )}
            </>
          )}
          {status === "DONE" && isManager && (
            <Button
              type="button"
              disabled={loading}
              onClick={() => transitionTo("INVOICED", "Faturada")}
            >
              Marcar como faturada
            </Button>
          )}
          {(quoteDraft || quotePending) && isManager && status === "DRAFT" && (
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={() => transitionTo("CANCELLED")}
            >
              Cancelar OS
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-ink-mute">
        Status: <strong className="text-ink">{STATUS_LABELS[status] ?? status}</strong>
        {quotePending && " — orçamento enviado, aguardando resposta do cliente."}
        {status === "CANCELLED" && " — reservas liberadas."}
        {status === "DONE" && " — estoque consumido."}
        {status === "INVOICED" && " — faturamento operacional (sem NF-e)."}
      </p>
    </div>
  );
}
