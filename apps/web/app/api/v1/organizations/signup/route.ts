import { ORG_COOKIE, withUserAuth } from "@oficina/auth";
import {
  apiError,
  apiSuccess,
  createOrganizationSignupSchema,
} from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
import {
  createSubscriptionCheckout,
  isMercadoPagoConfigured,
} from "@/server/modules/billing";
import { prisma } from "@oficina/database";

export const POST = withUserAuth(async (ctx, request) => {
  const parsed = await parseJson(request, createOrganizationSignupSchema);
  if ("error" in parsed) return parsed.error;

  const existing = await prisma.membership.findFirst({
    where: { userId: ctx.userId, active: true },
  });
  if (existing) {
    return apiError("Você já pertence a uma oficina. Use convite para entrar em outra.", 400);
  }

  const organization = await organizationRepository.createWithOwner({
    name: parsed.data.name,
    ownerUserId: ctx.userId,
    ownerEmail: ctx.email,
  });

  let checkoutUrl: string | null = null;

  if (isMercadoPagoConfigured()) {
    try {
      const checkout = await createSubscriptionCheckout({
        organizationId: organization.id,
        payerEmail: ctx.email,
        organizationName: organization.name,
        interval: parsed.data.interval,
        successPath: "/onboarding/setup?checkout=success",
        cancelPath: "/billing?checkout=canceled",
      });
      await organizationRepository.updateBilling(organization.id, {
        mpPreapprovalId: checkout.preapprovalId,
        mpPlanId: parsed.data.interval,
      });
      checkoutUrl = checkout.initPoint;
    } catch (err) {
      console.error("[signup checkout]", err);
      // Org criada; usuário completa pagamento depois em /billing
    }
  }

  const response = apiSuccess(
    {
      organizationId: organization.id,
      organizationSlug: organization.slug,
      trialEndsAt: organization.trialEndsAt,
      checkoutUrl,
    },
    201,
  );
  response.headers.append(
    "Set-Cookie",
    `${ORG_COOKIE}=${organization.slug}; Path=/; HttpOnly; SameSite=Lax`,
  );
  return response;
});
