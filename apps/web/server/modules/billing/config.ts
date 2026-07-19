/** Política comercial do plano único Oficina (SaaS). */
export const BILLING_TRIAL_DAYS = 14;

export type BillingInterval = "monthly" | "yearly";

export function getStripePriceId(interval: BillingInterval): string {
  const monthly = process.env.STRIPE_PRICE_MONTHLY;
  const yearly = process.env.STRIPE_PRICE_YEARLY;
  const priceId = interval === "yearly" ? yearly : monthly;
  if (!priceId || priceId.includes("placeholder")) {
    throw new Error(
      interval === "yearly"
        ? "STRIPE_PRICE_YEARLY não configurado"
        : "STRIPE_PRICE_MONTHLY não configurado",
    );
  }
  return priceId;
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL não configurado");
  return url;
}
