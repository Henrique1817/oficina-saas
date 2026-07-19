import type Stripe from "stripe";
import type { PlanStatus } from "@oficina/database";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
export {
  organizationHasAccess,
  pastDueGraceRemainingDays,
  PAST_DUE_GRACE_DAYS,
} from "@oficina/shared";

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): PlanStatus {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "CANCELED";
    case "incomplete":
    case "paused":
    default:
      return "PAST_DUE";
  }
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(
    key && !key.includes("your_key") && !key.includes("placeholder") && key.length > 10,
  );
}

export async function syncOrganizationFromSubscription(
  subscription: Stripe.Subscription,
  organizationIdHint?: string | null,
) {
  const organizationId =
    organizationIdHint || subscription.metadata?.organizationId || null;

  let org = organizationId
    ? await organizationRepository.findById(organizationId)
    : null;

  if (!org && typeof subscription.customer === "string") {
    org = await organizationRepository.findByStripeCustomerId(subscription.customer);
  }

  if (!org) {
    console.warn("[billing] org not found for subscription", subscription.id);
    return null;
  }

  const planStatus = mapStripeSubscriptionStatus(subscription.status);
  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : org.trialEndsAt;

  let pastDueAt: Date | null | undefined = undefined;
  if (planStatus === "PAST_DUE") {
    pastDueAt = org.pastDueAt ?? new Date();
  } else if (planStatus === "ACTIVE" || planStatus === "TRIALING") {
    pastDueAt = null;
  }

  return organizationRepository.updateBilling(org.id, {
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : org.stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    planStatus,
    trialEndsAt,
    pastDueAt,
  });
}
