import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess } from "@oficina/shared";
import {
  checkoutBodySchema,
  createSubscriptionCheckout,
  isMercadoPagoConfigured,
} from "@/server/modules/billing";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
import { parseJson } from "@/server/lib/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withAuth(async (ctx, request) => {
  if (!isMercadoPagoConfigured()) {
    return apiError("Pagamentos não configurados", 503, "MP_NOT_CONFIGURED");
  }

  if (ctx.role !== "ADMIN") {
    return apiError("Apenas o admin da oficina pode gerenciar a assinatura", 403);
  }

  const parsed = await parseJson(request, checkoutBodySchema);
  if ("error" in parsed) return parsed.error;

  const org = await organizationRepository.findById(ctx.organizationId);
  if (!org) return apiError("Organização não encontrada", 404);

  try {
    const checkout = await createSubscriptionCheckout({
      organizationId: org.id,
      payerEmail: ctx.email,
      organizationName: org.name,
      interval: parsed.data.interval,
      legalVersion: parsed.data.legalVersion,
    });

    await organizationRepository.updateBilling(org.id, {
      mpPreapprovalId: checkout.preapprovalId,
      mpPlanId: parsed.data.interval,
    });

    return apiSuccess({
      preapprovalId: checkout.preapprovalId,
      initPoint: checkout.initPoint,
      mode: checkout.mode,
      /** Compat com client antigo que esperava `url` */
      url: checkout.initPoint,
    });
  } catch (err) {
    console.error("[mp:checkout] failed", err);
    return apiError("Não foi possível iniciar o checkout", 500, "CHECKOUT_FAILED");
  }
}, { roles: ["ADMIN"], allowWithoutPlan: true });
