import { getStripe } from "@/server/modules/billing/stripe";
import { handleStripeWebhookEvent } from "@/server/modules/billing/webhook";
import { apiError, apiSuccess } from "@oficina/shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret.includes("placeholder")) {
    return apiError("Webhook não configurado", 503, "WEBHOOK_NOT_CONFIGURED");
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return apiError("Assinatura ausente", 400);

  const rawBody = await request.text();

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    await handleStripeWebhookEvent(event);
    return apiSuccess({ received: true });
  } catch (err) {
    console.error("[stripe webhook]", err);
    const message = err instanceof Error ? err.message : "Webhook inválido";
    return apiError(message, 400, "WEBHOOK_ERROR");
  }
}
