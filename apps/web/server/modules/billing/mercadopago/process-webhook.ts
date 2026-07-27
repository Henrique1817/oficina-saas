import type { PlanStatus } from "@oficina/database";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
import {
  fetchAuthorizedPayment,
  fetchPayment,
  fetchPreApproval,
} from "./client";
import { coerceId } from "./schemas";
import {
  claimWebhookEvent,
  finalizeWebhookClaim,
  releaseWebhookClaim,
} from "./subscriptions-store";
import {
  parseExternalReference,
  planAmountMatches,
  resolvePlan,
  type PlanDefinition,
} from "./types";
import type { BillingInterval } from "../config";

export {
  organizationHasAccess,
  pastDueGraceRemainingDays,
  PAST_DUE_GRACE_DAYS,
} from "@oficina/shared";

/** Status PreApproval MP → PlanStatus domínio. */
export function mapPreApprovalStatus(status: string | null | undefined): PlanStatus {
  switch ((status ?? "").toLowerCase()) {
    case "pending":
      return "TRIALING";
    case "authorized":
      return "ACTIVE";
    case "paused":
      return "PAST_DUE";
    case "cancelled":
    case "canceled":
      return "CANCELED";
    default:
      return "PAST_DUE";
  }
}

type PreApprovalResource = {
  id?: string | number;
  status?: string;
  payer_id?: number | string;
  external_reference?: string;
  metadata?: Record<string, unknown> | null;
  auto_recurring?: {
    transaction_amount?: number | string;
    free_trial?: { frequency?: number; frequency_type?: string } | null;
  } | null;
  date_created?: string;
};

type PaymentResource = {
  id?: string | number;
  status?: string;
  transaction_amount?: number | string;
  external_reference?: string;
  metadata?: Record<string, unknown> | null;
  payer?: { id?: number | string; email?: string } | null;
};

type AuthorizedPaymentResource = {
  id?: string | number;
  status?: string;
  transaction_amount?: number | string;
  external_reference?: string;
  preapproval_id?: string;
  payment?: { id?: number | string; status?: string } | null;
  metadata?: Record<string, unknown> | null;
};

function metaString(
  meta: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const v = meta?.[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

async function findOrgForBilling(input: {
  organizationId?: string | null;
  mpPayerId?: string | null;
  mpPreapprovalId?: string | null;
  externalReference?: string | null;
}) {
  const fromRef = parseExternalReference(input.externalReference).organizationId;
  const organizationId = input.organizationId || fromRef;

  if (organizationId) {
    const org = await organizationRepository.findById(organizationId);
    if (org) return org;
  }
  if (input.mpPreapprovalId) {
    const org = await organizationRepository.findByMpPreapprovalId(
      input.mpPreapprovalId,
    );
    if (org) return org;
  }
  if (input.mpPayerId) {
    const org = await organizationRepository.findByMpPayerId(input.mpPayerId);
    if (org) return org;
  }
  return null;
}

function resolvePlanFromRefs(input: {
  planId?: string | null;
  externalReference?: string | null;
  orgPlanId?: string | null;
}): PlanDefinition | null {
  const candidates = [
    input.planId,
    parseExternalReference(input.externalReference).planId,
    input.orgPlanId,
  ];
  for (const c of candidates) {
    if (c === "monthly" || c === "yearly") return resolvePlan(c);
  }
  return null;
}

export async function syncOrganizationFromPreApproval(
  preapproval: PreApprovalResource,
  organizationIdHint?: string | null,
) {
  const preapprovalId = coerceId(preapproval.id);
  const meta = preapproval.metadata ?? undefined;
  const organizationId =
    organizationIdHint ||
    metaString(meta, "organization_id") ||
    metaString(meta, "organizationId");

  const org = await findOrgForBilling({
    organizationId,
    mpPreapprovalId: preapprovalId,
    mpPayerId: coerceId(preapproval.payer_id),
    externalReference: preapproval.external_reference,
  });

  if (!org) {
    console.warn("[mp:webhook] org not found for preapproval", preapprovalId);
    return null;
  }

  const planStatus = mapPreApprovalStatus(preapproval.status);
  const planId =
    metaString(meta, "plan_id") ||
    parseExternalReference(preapproval.external_reference).planId ||
    org.mpPlanId;

  let pastDueAt: Date | null | undefined;
  if (planStatus === "PAST_DUE") {
    pastDueAt = org.pastDueAt ?? new Date();
  } else if (planStatus === "ACTIVE" || planStatus === "TRIALING") {
    pastDueAt = null;
  }

  // Se authorized com free_trial ainda ativo → manter TRIALING até trialEndsAt
  let nextStatus = planStatus;
  if (
    planStatus === "ACTIVE" &&
    org.trialEndsAt &&
    org.trialEndsAt.getTime() > Date.now() &&
    org.planStatus === "TRIALING"
  ) {
    nextStatus = "TRIALING";
  }

  return organizationRepository.updateBilling(org.id, {
    mpPayerId: coerceId(preapproval.payer_id) ?? org.mpPayerId,
    mpPreapprovalId: preapprovalId ?? org.mpPreapprovalId,
    mpPlanId: planId ?? org.mpPlanId,
    planStatus: nextStatus,
    pastDueAt,
  });
}

async function fulfillApprovedCharge(input: {
  claimKey: string;
  topic: string;
  amount: number | string | null | undefined;
  externalReference?: string | null;
  metadata?: Record<string, unknown> | null;
  mpPayerId?: string | null;
  mpPreapprovalId?: string | null;
  paymentStatus: string;
}) {
  const terminalFail = ["refunded", "charged_back", "cancelled", "canceled", "rejected"];
  const status = input.paymentStatus.toLowerCase();

  if (terminalFail.includes(status)) {
    const org = await findOrgForBilling({
      organizationId: metaString(input.metadata, "organization_id"),
      mpPayerId: input.mpPayerId,
      mpPreapprovalId: input.mpPreapprovalId,
      externalReference: input.externalReference,
    });
    if (org && (status === "refunded" || status === "charged_back" || status.startsWith("cancel"))) {
      await organizationRepository.updateBilling(org.id, {
        planStatus: "CANCELED",
        pastDueAt: null,
      });
    } else if (org && status === "rejected") {
      await organizationRepository.updateBilling(org.id, {
        planStatus: "PAST_DUE",
        pastDueAt: org.pastDueAt ?? new Date(),
      });
      await notifyPaymentFailed(org.id, org.name);
    }
    await finalizeWebhookClaim(input.claimKey, "done", { status });
    return;
  }

  if (status !== "approved") {
    await finalizeWebhookClaim(input.claimKey, "done", { status, ignored: true });
    return;
  }

  const org = await findOrgForBilling({
    organizationId: metaString(input.metadata, "organization_id"),
    mpPayerId: input.mpPayerId,
    mpPreapprovalId: input.mpPreapprovalId,
    externalReference: input.externalReference,
  });

  if (!org) {
    console.warn("[mp:webhook] org not found for approved charge", input.claimKey);
    await finalizeWebhookClaim(input.claimKey, "done", { ignored: "org_not_found" });
    return;
  }

  const plan = resolvePlanFromRefs({
    planId: metaString(input.metadata, "plan_id"),
    externalReference: input.externalReference,
    orgPlanId: org.mpPlanId,
  });

  if (plan && input.amount !== null && input.amount !== undefined) {
    if (!planAmountMatches(plan.amountCents, input.amount)) {
      console.error("[mp:webhook] amount/plan mismatch — acesso NÃO liberado", {
        claimKey: input.claimKey,
        expectedCents: plan.amountCents,
        amount: input.amount,
        organizationId: org.id,
      });
      await finalizeWebhookClaim(input.claimKey, "done", {
        ignored: "amount_mismatch",
      });
      return;
    }
  }

  await organizationRepository.updateBilling(org.id, {
    mpPayerId: input.mpPayerId ?? org.mpPayerId,
    mpPreapprovalId: input.mpPreapprovalId ?? org.mpPreapprovalId,
    mpPlanId: (plan?.id as BillingInterval | undefined) ?? org.mpPlanId,
    planStatus: "ACTIVE",
    pastDueAt: null,
  });

  await finalizeWebhookClaim(input.claimKey, "done", { fulfilled: true });
}

async function notifyPaymentFailed(organizationId: string, organizationName: string) {
  try {
    const { prisma } = await import("@oficina/database");
    const { sendPaymentFailedEmail } = await import("@/server/modules/email/send");
    const admin = await prisma.membership.findFirst({
      where: { organizationId, role: "ADMIN", active: true },
      include: { user: true },
    });
    if (admin?.user.email) {
      await sendPaymentFailedEmail({
        to: admin.user.email,
        organizationName,
      });
    }
  } catch (err) {
    console.error("[mp:webhook] payment_failed email", err);
  }
}

export async function processMercadoPagoWebhook(input: {
  topic: string;
  dataId: string;
}): Promise<{ handled: boolean }> {
  const topic = input.topic.toLowerCase();
  const dataId = input.dataId;

  // subscription_preapproval
  if (
    topic === "subscription_preapproval" ||
    topic === "subscription_preapproval_updated" ||
    (topic.includes("preapproval") &&
      !topic.includes("plan") &&
      !topic.includes("authorized"))
  ) {
    const claimKey = `preapproval:${dataId}`;
    const claim = await claimWebhookEvent({ claimKey, topic });
    if (!claim.claimed) {
      console.info("[mp:webhook] already processed", claimKey);
      return { handled: true };
    }
    try {
      const resource = (await fetchPreApproval(dataId)) as PreApprovalResource;
      await syncOrganizationFromPreApproval(resource);
      await finalizeWebhookClaim(claimKey, "done");
      return { handled: true };
    } catch (err) {
      console.error("[mp:webhook] preapproval process failed", err);
      await releaseWebhookClaim(claimKey);
      throw err;
    }
  }

  // subscription_authorized_payment
  if (
    topic === "subscription_authorized_payment" ||
    topic.includes("authorized_payment")
  ) {
    const claimKey = `authorized_payment:${dataId}`;
    const claim = await claimWebhookEvent({ claimKey, topic });
    if (!claim.claimed) {
      console.info("[mp:webhook] already processed", claimKey);
      return { handled: true };
    }
    try {
      const resource = (await fetchAuthorizedPayment(dataId)) as AuthorizedPaymentResource;
      const paymentStatus =
        resource.payment?.status ||
        resource.status ||
        "unknown";
      await fulfillApprovedCharge({
        claimKey,
        topic,
        amount: resource.transaction_amount,
        externalReference: resource.external_reference,
        metadata: resource.metadata,
        mpPreapprovalId: coerceId(resource.preapproval_id),
        paymentStatus: String(paymentStatus),
      });
      return { handled: true };
    } catch (err) {
      console.error("[mp:webhook] authorized_payment process failed", err);
      await releaseWebhookClaim(claimKey);
      throw err;
    }
  }

  // payment / payment.*
  if (topic === "payment" || topic.startsWith("payment.")) {
    const claimKey = `payment:${dataId}`;
    const claim = await claimWebhookEvent({ claimKey, topic });
    if (!claim.claimed) {
      console.info("[mp:webhook] already processed", claimKey);
      return { handled: true };
    }
    try {
      const resource = (await fetchPayment(dataId)) as PaymentResource;
      await fulfillApprovedCharge({
        claimKey,
        topic,
        amount: resource.transaction_amount,
        externalReference: resource.external_reference,
        metadata: resource.metadata,
        mpPayerId: coerceId(resource.payer?.id),
        paymentStatus: String(resource.status ?? "unknown"),
      });
      return { handled: true };
    } catch (err) {
      console.error("[mp:webhook] payment process failed", err);
      await releaseWebhookClaim(claimKey);
      throw err;
    }
  }

  console.info("[mp:webhook] ignored topic", topic);
  return { handled: false };
}
