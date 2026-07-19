import type Stripe from "stripe";
import {
  BILLING_TRIAL_DAYS,
  getAppUrl,
  getStripePriceId,
  type BillingInterval,
} from "./config";
import { getStripe } from "./stripe";

export type CreateTrialCheckoutInput = {
  /** Stripe Customer já criado (ou a criar) — e-mail do dono da oficina */
  customerId?: string;
  customerEmail: string;
  /** ID interno da organização (Fase 1) — vai no metadata da subscription */
  organizationId: string;
  interval?: BillingInterval;
  successPath?: string;
  cancelPath?: string;
};

/**
 * Checkout de assinatura com:
 * - 14 dias de trial
 * - cartão obrigatório no cadastro (`payment_method_collection: always`)
 * - cobrança automática ao fim do trial
 * - se faltar cartão no fim do trial, cancela a assinatura
 */
export async function createTrialCheckoutSession(
  input: CreateTrialCheckoutInput,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const appUrl = getAppUrl();
  const interval = input.interval ?? "monthly";
  const priceId = getStripePriceId(interval);
  const successPath = input.successPath ?? "/onboarding/setup?checkout=success";
  const cancelPath = input.cancelPath ?? "/billing?checkout=canceled";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: input.customerId,
    customer_email: input.customerId ? undefined : input.customerEmail,
    client_reference_id: input.organizationId,
    line_items: [{ price: priceId, quantity: 1 }],
    // Exige método de pagamento mesmo com total R$ 0 no trial
    payment_method_collection: "always",
    subscription_data: {
      trial_period_days: BILLING_TRIAL_DAYS,
      trial_settings: {
        end_behavior: {
          // Sem cartão no fim do trial → cancela (não gera fatura órfã)
          missing_payment_method: "cancel",
        },
      },
      metadata: {
        organizationId: input.organizationId,
        app: "oficina",
      },
    },
    metadata: {
      organizationId: input.organizationId,
      app: "oficina",
      flow: "signup_trial",
    },
    success_url: `${appUrl}${successPath}`,
    cancel_url: `${appUrl}${cancelPath}`,
    allow_promotion_codes: true,
  });

  return session;
}

export async function createOrGetStripeCustomer(input: {
  email: string;
  name?: string;
  organizationId: string;
  existingCustomerId?: string | null;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();

  if (input.existingCustomerId) {
    return stripe.customers.retrieve(input.existingCustomerId) as Promise<Stripe.Customer>;
  }

  return stripe.customers.create({
    email: input.email,
    name: input.name,
    metadata: {
      organizationId: input.organizationId,
      app: "oficina",
    },
  });
}

export async function createBillingPortalSession(input: {
  customerId: string;
  returnPath?: string;
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();
  const appUrl = getAppUrl();
  return stripe.billingPortal.sessions.create({
    customer: input.customerId,
    return_url: `${appUrl}${input.returnPath ?? "/billing"}`,
  });
}
