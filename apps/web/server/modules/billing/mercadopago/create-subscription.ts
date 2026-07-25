import { BILLING_TRIAL_DAYS, type BillingInterval } from "../config";
import { getPreApprovalClient } from "./client";
import {
  getAppUrl,
  getMercadoPagoMode,
  useSandbox,
} from "./env";
import { buildExternalReference, resolvePlan } from "./types";

export type CreateSubscriptionInput = {
  organizationId: string;
  payerEmail: string;
  organizationName?: string;
  interval: BillingInterval;
  successPath?: string;
  cancelPath?: string;
  legalVersion?: string;
};

export type CreateSubscriptionResult = {
  preapprovalId: string;
  initPoint: string;
  mode: "production" | "sandbox";
  externalReference: string;
};

/**
 * Cria PreApproval (assinatura) no Mercado Pago e devolve init_point.
 * Preços sempre do catálogo servidor. Sem misturar sandbox/produção.
 */
export async function createSubscriptionCheckout(
  input: CreateSubscriptionInput,
): Promise<CreateSubscriptionResult> {
  const plan = resolvePlan(input.interval);
  const appUrl = getAppUrl();
  const mode = getMercadoPagoMode();
  const sandbox = useSandbox();
  const externalReference = buildExternalReference(
    input.organizationId,
    input.interval,
  );
  const successPath =
    input.successPath ?? "/onboarding/setup?checkout=success";
  const backUrl = `${appUrl}${successPath}`;
  const notificationUrl = `${appUrl}/api/webhooks/mercadopago`;

  const client = getPreApprovalClient();
  const idempotencyKey = `sub-${input.organizationId}-${input.interval}-${externalReference}`;

  // Cast: SDK tipa auto_recurring sem free_trial/notification_url (API aceita).
  const body = {
    reason: plan.reason,
    external_reference: externalReference,
    payer_email: input.payerEmail,
    auto_recurring: {
      frequency: plan.frequency,
      frequency_type: plan.frequencyType,
      transaction_amount: plan.amountBrl,
      currency_id: "BRL",
      free_trial: {
        frequency: BILLING_TRIAL_DAYS,
        frequency_type: "days",
      },
    },
    back_url: backUrl,
    status: "pending",
    notification_url: notificationUrl,
  };

  console.info("[mp:checkout] creating preapproval", {
    organizationId: input.organizationId,
    planId: plan.id,
    mode,
    externalReference,
  });

  const result = (await client.create({
    body: body as never,
    requestOptions: {
      idempotencyKey,
    },
  })) as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
  };

  const preapprovalId = result.id ? String(result.id) : null;
  if (!preapprovalId) {
    throw new Error("preapproval_id_missing");
  }

  // Nunca misturar: produção → só init_point; sandbox → só sandbox_init_point
  const initPoint = sandbox ? result.sandbox_init_point : result.init_point;

  if (!initPoint) {
    console.error("[mp:checkout] init_point ausente para o modo", {
      mode,
      preapprovalId,
    });
    throw new Error("init_point_missing");
  }

  return {
    preapprovalId,
    initPoint,
    mode,
    externalReference,
  };
}

/** Cancela assinatura PreApproval no MP. */
export async function cancelSubscription(preapprovalId: string): Promise<void> {
  const client = getPreApprovalClient();
  await client.update({
    id: preapprovalId,
    body: { status: "cancelled" },
  });
  console.info("[mp:checkout] preapproval cancelled", { preapprovalId });
}
