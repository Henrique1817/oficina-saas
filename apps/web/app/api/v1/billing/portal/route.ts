import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess } from "@oficina/shared";
import {
  createBillingPortalSession,
  isStripeConfigured,
} from "@/server/modules/billing";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";

export const POST = withAuth(async (ctx) => {
  if (!isStripeConfigured()) {
    return apiError("Stripe não configurado", 503, "STRIPE_NOT_CONFIGURED");
  }
  if (ctx.role !== "ADMIN") {
    return apiError("Apenas o admin pode abrir o portal", 403);
  }

  const org = await organizationRepository.findById(ctx.organizationId);
  if (!org?.stripeCustomerId) {
    return apiError("Nenhuma assinatura Stripe vinculada. Inicie o checkout primeiro.", 400);
  }

  const session = await createBillingPortalSession({
    customerId: org.stripeCustomerId,
  });
  return apiSuccess({ url: session.url });
}, { roles: ["ADMIN"], allowWithoutPlan: true });
