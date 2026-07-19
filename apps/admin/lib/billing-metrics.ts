import type { PlanStatus } from "@oficina/database";

/** Mesmo critério de `/admin/growth` no web. */
export const MRR_UNIT_BRL = 97;

export const STATUS_LABEL: Record<PlanStatus, string> = {
  TRIALING: "Trial",
  ACTIVE: "Pago",
  PAST_DUE: "Inadimplente",
  CANCELED: "Cancelado",
};

export function estimateMrr(activeCount: number) {
  return activeCount * MRR_UNIT_BRL;
}

export function stripeDashboardUrl(
  kind: "customers" | "subscriptions",
  id: string,
) {
  const test = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test");
  const base = test
    ? "https://dashboard.stripe.com/test"
    : "https://dashboard.stripe.com";
  return `${base}/${kind}/${id}`;
}
