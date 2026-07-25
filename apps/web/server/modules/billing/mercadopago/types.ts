import type { BillingInterval } from "../config";

/** Preços resolvidos só no servidor (BRL / site_id MLB). Nunca confiar no client. */
export const PLAN_CATALOG = {
  monthly: {
    id: "monthly" as const,
    reason: "Oficina — plano mensal",
    /** Valor em reais (não centavos) — API MP usa decimal */
    amountBrl: 97,
    amountCents: 9700,
    frequency: 1,
    frequencyType: "months" as const,
  },
  yearly: {
    id: "yearly" as const,
    reason: "Oficina — plano anual",
    amountBrl: 970,
    amountCents: 97000,
    frequency: 12,
    frequencyType: "months" as const,
  },
} as const;

export type PlanDefinition = (typeof PLAN_CATALOG)[BillingInterval];

export function resolvePlan(interval: BillingInterval): PlanDefinition {
  return PLAN_CATALOG[interval];
}

export function planAmountMatches(
  expectedCents: number,
  actualAmount: number | string | null | undefined,
): boolean {
  if (actualAmount === null || actualAmount === undefined) return false;
  const actual =
    typeof actualAmount === "string" ? Number(actualAmount) : actualAmount;
  if (!Number.isFinite(actual)) return false;
  const actualCents = Math.round(actual * 100);
  return actualCents === expectedCents;
}

/**
 * external_reference estável: `sub_{plan}_{organizationId}_{uuidCurto}`
 * organizationId (cuid) fica embutido para lookup confiável sem metadata.
 */
export function buildExternalReference(
  organizationId: string,
  planId: BillingInterval,
): string {
  const uuid = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  return `sub_${planId}_${organizationId}_${uuid}`;
}

export function parseExternalReference(ref: string | null | undefined): {
  planId: BillingInterval | null;
  organizationId: string | null;
} {
  if (!ref) return { planId: null, organizationId: null };
  const m = /^sub_(monthly|yearly)_([a-z0-9]+)_[a-z0-9]+$/i.exec(ref.trim());
  if (!m) return { planId: null, organizationId: null };
  return {
    planId: m[1] as BillingInterval,
    organizationId: m[2] ?? null,
  };
}
