import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("your_key") || key.includes("placeholder")) {
    throw new Error("STRIPE_SECRET_KEY não configurado");
  }
  stripe = new Stripe(key, {
    apiVersion: "2026-06-24.dahlia",
    typescript: true,
  });
  return stripe;
}
