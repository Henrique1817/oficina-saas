"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  extendTrial,
  saveInternalNote,
  startImpersonation,
  suspendOrganization,
  unsuspendOrganization,
} from "./actions";
import { setBillingExempt } from "../pagamentos/actions";
import { setDesignPartner } from "../pilotos/actions";

export function OrgActions({
  organizationId,
  suspended,
  billingExempt,
  designPartner,
  initialNote,
  canTenantsWrite,
  canBillingWrite,
  canImpersonate,
}: {
  organizationId: string;
  suspended: boolean;
  billingExempt: boolean;
  designPartner: boolean;
  initialNote: string;
  canTenantsWrite: boolean;
  canBillingWrite: boolean;
  canImpersonate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(initialNote);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function run(fn: () => Promise<void>, okMsg: string) {
    setMessage(null);
    startTransition(async () => {
      try {
        await fn();
        setMessage(okMsg);
        router.refresh();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Erro");
      }
    });
  }

  if (!canTenantsWrite && !canBillingWrite && !canImpersonate) {
    return (
      <p className="text-sm text-muted-foreground">
        Seu role é somente leitura — ações de tenant/cobrança ocultas.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {canTenantsWrite && (
        <>
          <div className="flex flex-wrap gap-2">
            {suspended ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => unsuspendOrganization(organizationId), "Acesso reativado")}
                className="rounded-lg bg-success px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                Reativar acesso
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => suspendOrganization(organizationId), "Oficina suspensa")}
                className="rounded-lg bg-danger px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Suspender acesso
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => extendTrial(organizationId, 7), "Trial +7 dias")}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              Estender trial +7 dias
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => extendTrial(organizationId, 14), "Trial +14 dias")}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              Estender trial +14 dias
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(
                  () => setDesignPartner(organizationId, !designPartner),
                  designPartner ? "Removido do cohort" : "Marcado como piloto",
                )
              }
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              {designPartner ? "Sair do cohort piloto" : "Marcar design partner"}
            </button>
            {canBillingWrite && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(
                    () => setBillingExempt(organizationId, !billingExempt),
                    billingExempt ? "Cortesia removida" : "Marcada como cortesia",
                  )
                }
                className="rounded-lg border border-accent/40 px-3 py-2 text-sm text-accent hover:bg-accent/10 disabled:opacity-60"
              >
                {billingExempt ? "Remover cortesia" : "Marcar cortesia"}
              </button>
            )}
          </div>
          {designPartner && (
            <p className="text-xs text-accent">No cohort soft launch (ver /pilotos).</p>
          )}
          {billingExempt && (
            <p className="text-xs text-accent">
              Cortesia ativa: sem dunning e acesso liberado (exceto se suspensa).
            </p>
          )}

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Nota interna</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Observações da equipe (não visível ao tenant)"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => saveInternalNote(organizationId, note), "Nota salva")}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Salvar nota
            </button>
          </div>
        </>
      )}

      {!canTenantsWrite && canBillingWrite && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => setBillingExempt(organizationId, !billingExempt),
                billingExempt ? "Cortesia removida" : "Marcada como cortesia",
              )
            }
            className="rounded-lg border border-accent/40 px-3 py-2 text-sm text-accent hover:bg-accent/10 disabled:opacity-60"
          >
            {billingExempt ? "Remover cortesia" : "Marcar cortesia"}
          </button>
        </div>
      )}

      {canImpersonate && (
        <div className="space-y-2 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm font-medium">Impersonar (abrir no produto)</p>
          <p className="text-xs text-muted-foreground">
            Gera um link de uso único (15 min). Você precisa estar logado no web com a mesma conta.
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (opcional)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                try {
                  const url = await startImpersonation(organizationId, reason);
                  window.open(url, "_blank", "noopener,noreferrer");
                  setMessage("Link aberto em nova aba");
                  router.refresh();
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Erro");
                }
              });
            }}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            Abrir como ADMIN da oficina
          </button>
        </div>
      )}
    </div>
  );
}
