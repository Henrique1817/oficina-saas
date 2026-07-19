import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess } from "@oficina/shared";
import {
  createBillingPortalSession,
  createOrGetStripeCustomer,
  createTrialCheckoutSession,
  isStripeConfigured,
} from "@/server/modules/billing";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
import { z } from "zod";
import { parseJson } from "@/server/lib/parse";

const checkoutBodySchema = z.object({
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const POST = withAuth(async (ctx, request) => {
  if (!isStripeConfigured()) {
    return apiError("Stripe não configurado", 503, "STRIPE_NOT_CONFIGURED");
  }

  if (ctx.role !== "ADMIN") {
    return apiError("Apenas o admin da oficina pode gerenciar a assinatura", 403);
  }

  const parsed = await parseJson(request, checkoutBodySchema);
  if ("error" in parsed) return parsed.error;

  const org = await organizationRepository.findById(ctx.organizationId);
  if (!org) return apiError("Organização não encontrada", 404);

  const customer = await createOrGetStripeCustomer({
    email: ctx.email,
    name: org.name,
    organizationId: org.id,
    existingCustomerId: org.stripeCustomerId,
  });

  if (!org.stripeCustomerId) {
    await organizationRepository.updateBilling(org.id, {
      stripeCustomerId: customer.id,
    });
  }

  const session = await createTrialCheckoutSession({
    customerId: customer.id,
    customerEmail: ctx.email,
    organizationId: org.id,
    interval: parsed.data.interval,
  });

  if (!session.url) return apiError("Não foi possível criar o Checkout", 500);
  return apiSuccess({ url: session.url });
}, { roles: ["ADMIN"], allowWithoutPlan: true });
