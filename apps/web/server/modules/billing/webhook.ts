import type Stripe from "stripe";
import { getStripe } from "./stripe";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
import { syncOrganizationFromSubscription } from "./access";

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const details = invoice.parent?.subscription_details;
  if (details?.subscription) {
    return typeof details.subscription === "string"
      ? details.subscription
      : details.subscription.id;
  }
  return null;
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const organizationId =
        session.client_reference_id ||
        session.metadata?.organizationId ||
        null;
      if (!organizationId) break;

      const customerId =
        typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      await organizationRepository.updateBilling(organizationId, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        planStatus: "TRIALING",
      });

      if (subscriptionId) {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncOrganizationFromSubscription(subscription, organizationId);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncOrganizationFromSubscription(subscription);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = subscriptionIdFromInvoice(invoice);
      if (!subId) break;
      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(subId);
      await syncOrganizationFromSubscription(subscription);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customerId) break;
      const org = await organizationRepository.findByStripeCustomerId(customerId);
      if (org) {
        await organizationRepository.updateBilling(org.id, {
          planStatus: "PAST_DUE",
          pastDueAt: org.pastDueAt ?? new Date(),
        });
        const { prisma } = await import("@oficina/database");
        const { sendPaymentFailedEmail } = await import("@/server/modules/email/send");
        const admin = await prisma.membership.findFirst({
          where: { organizationId: org.id, role: "ADMIN", active: true },
          include: { user: true },
        });
        if (admin?.user.email) {
          await sendPaymentFailedEmail({
            to: admin.user.email,
            organizationName: org.name,
          });
        }
      }
      break;
    }

    default:
      break;
  }
}
