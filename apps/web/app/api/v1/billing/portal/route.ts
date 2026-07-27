import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess } from "@oficina/shared";
import {
  cancelSubscription,
  isMercadoPagoConfigured,
} from "@/server/modules/billing";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
import { z } from "zod";
import { parseJson } from "@/server/lib/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const portalBodySchema = z.object({
  action: z.enum(["cancel"]).default("cancel"),
});

/**
 * Equivalente ao portal de gerenciamento: cancelar PreApproval via API MP.
 * Atualização de cartão → novo checkout.
 */
export const POST = withAuth(async (ctx, request) => {
  if (!isMercadoPagoConfigured()) {
    return apiError("Pagamentos não configurados", 503, "MP_NOT_CONFIGURED");
  }
  if (ctx.role !== "ADMIN") {
    return apiError("Apenas o admin pode gerenciar a assinatura", 403);
  }

  const org = await organizationRepository.findById(ctx.organizationId);
  if (!org?.mpPreapprovalId) {
    return apiError(
      "Nenhuma assinatura vinculada. Inicie o checkout primeiro.",
      400,
    );
  }

  const parsed = await parseJson(request, portalBodySchema);
  if ("error" in parsed) return parsed.error;

  try {
    if (parsed.data.action === "cancel") {
      await cancelSubscription(org.mpPreapprovalId);
      await organizationRepository.updateBilling(org.id, {
        planStatus: "CANCELED",
        pastDueAt: null,
      });
      return apiSuccess({ cancelled: true });
    }
    return apiError("Ação não suportada", 400);
  } catch (err) {
    console.error("[mp:portal] failed", err);
    return apiError("Não foi possível atualizar a assinatura", 500, "PORTAL_FAILED");
  }
}, { roles: ["ADMIN"], allowWithoutPlan: true });
