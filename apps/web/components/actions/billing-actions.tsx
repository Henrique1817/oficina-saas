"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function BillingActions({
  canManage,
  hasSubscription,
}: {
  canManage: boolean;
  hasSubscription: boolean;
}) {
  const [loading, setLoading] = useState<"checkout" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground">
        Peça ao administrador da oficina para gerenciar a assinatura.
      </p>
    );
  }

  async function startCheckout(interval: "monthly" | "yearly") {
    setLoading("checkout");
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<{ url?: string; initPoint?: string }>(
        "/api/v1/billing/checkout",
        {
          method: "POST",
          body: JSON.stringify({ interval }),
        },
      );
      const initPoint = data.initPoint ?? data.url;
      if (!initPoint) throw new Error("Link de pagamento indisponível");
      window.location.href = initPoint;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no checkout");
      setLoading(null);
    }
  }

  async function cancelPlan() {
    if (
      !window.confirm(
        "Cancelar a assinatura? O acesso continua até o fim do período já pago, conforme regras do Mercado Pago.",
      )
    ) {
      return;
    }
    setLoading("cancel");
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/api/v1/billing/portal", {
        method: "POST",
        body: JSON.stringify({ action: "cancel" }),
      });
      setMessage("Assinatura cancelada.");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao cancelar");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-ok">{message}</p>}
      <p className="text-xs text-ink-mute">
        Nenhum dado de cartão fica neste servidor — o pagamento é feito só no
        Mercado Pago.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={loading !== null}
          onClick={() => startCheckout("monthly")}
        >
          {loading === "checkout" ? "Redirecionando..." : "Assinar mensal (R$ 97)"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading !== null}
          onClick={() => startCheckout("yearly")}
        >
          Plano anual (R$ 970)
        </Button>
        {hasSubscription && (
          <Button
            type="button"
            variant="secondary"
            disabled={loading !== null}
            onClick={cancelPlan}
          >
            {loading === "cancel" ? "Cancelando..." : "Cancelar assinatura"}
          </Button>
        )}
      </div>
    </div>
  );
}
