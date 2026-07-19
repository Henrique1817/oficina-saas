import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, serviceOrderQuoteActionSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { serviceOrderRepository } from "@/server/modules/service-orders/service-order.repository";

function getId(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.indexOf("service-orders") + 1]!;
}

export const POST = withAuth(async (ctx, request) => {
  const order = await serviceOrderRepository.getById(ctx.organizationId, getId(request));
  if (!order) return apiError("Service order not found", 404);

  const parsed = await parseJson(request, serviceOrderQuoteActionSchema);
  if ("error" in parsed) return parsed.error;

  try {
    const { action, notes } = parsed.data;
    let updated;

    switch (action) {
      case "send":
        updated = await serviceOrderRepository.sendQuote(ctx.organizationId, getId(request), ctx.userId);
        break;
      case "approve":
        updated = await serviceOrderRepository.approveQuote(
          ctx.organizationId,
          getId(request),
          ctx.userId,
          notes,
        );
        break;
      case "reject":
        updated = await serviceOrderRepository.rejectQuote(
          ctx.organizationId,
          getId(request),
          ctx.userId,
          notes,
        );
        break;
    }

    return apiSuccess(updated);
  } catch (e) {
    if (e instanceof Error) {
      const map: Record<string, { message: string; status: number }> = {
        QUOTE_ONLY_DRAFT: { message: "Orçamento só pode ser alterado em OS rascunho", status: 400 },
        QUOTE_ALREADY_SENT: { message: "Orçamento já foi enviado", status: 400 },
        QUOTE_NOT_SENT: { message: "Envie o orçamento antes de aprovar ou reprovar", status: 400 },
        QUOTE_EMPTY: {
          message: "Adicione peça, serviço ou mão de obra antes de enviar o orçamento",
          status: 400,
        },
        INVALID_TRANSITION: { message: "Transição de status inválida", status: 400 },
      };
      const hit = map[e.message];
      if (hit) return apiError(hit.message, hit.status);
    }
    throw e;
  }
}, { roles: ["ADMIN", "MANAGER"] });
