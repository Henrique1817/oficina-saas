"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export function BillingActions({
  canManage,
  hasStripeCustomer,
}: {
  canManage: boolean;
  hasStripeCustomer: boolean;
}) {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const { url } = await apiFetch<{ url: string }>("/api/v1/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ interval }),
      });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no checkout");
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    setError(null);
    try {
      const { url } = await apiFetch<{ url: string }>("/api/v1/billing/portal", {
        method: "POST",
      });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao abrir portal");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={loading !== null}
          onClick={() => startCheckout("monthly")}
        >
          {loading === "checkout" ? "Redirecionando..." : "Assinar / cadastrar cartão (mensal)"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading !== null}
          onClick={() => startCheckout("yearly")}
        >
          Plano anual
        </Button>
        {hasStripeCustomer && (
          <Button
            type="button"
            variant="secondary"
            disabled={loading !== null}
            onClick={openPortal}
          >
            {loading === "portal" ? "Abrindo..." : "Portal Stripe"}
          </Button>
        )}
      </div>
    </div>
  );
}
