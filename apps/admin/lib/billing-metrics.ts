import type { PlanStatus } from "@oficina/database";

/** Mesmo critério de `/admin/growth` no web. */
export const MRR_UNIT_BRL = 97;

export const STATUS_LABEL: Record<PlanStatus, string> = {
  TRIALING: "Trial",
  ACTIVE: "Pago",
  PAST_DUE: "Inadimplente",
  CANCELED: "Cancelado",
};

export function estimateMrr(activeCount: number) {
  return activeCount * MRR_UNIT_BRL;
}

/** Link para a assinatura no painel Mercado Pago (BR). */
export function mpPreapprovalUrl(preapprovalId: string) {
  return `https://www.mercadopago.com.br/subscriptions/admin#/${encodeURIComponent(preapprovalId)}`;
}
