import { withAuth } from "@oficina/auth";
import { apiError, apiSuccess, updateOrganizationBrandingSchema } from "@oficina/shared";
import { parseJson } from "@/server/lib/parse";
import { organizationRepository } from "@/server/modules/organizations/organization.repository";
import { parseWhatsappTemplates } from "@/lib/quote-messaging";

function emptyToNull(v: string | null | undefined) {
  if (v === undefined) return undefined;
  if (v === null || v.trim() === "") return null;
  return v.trim();
}

export const GET = withAuth(async (ctx) => {
  const org = await organizationRepository.findById(ctx.organizationId);
  if (!org) return apiError("Organização não encontrada", 404);
  return apiSuccess({
    id: org.id,
    name: org.name,
    slug: org.slug,
    phone: org.phone,
    email: org.email,
    address: org.address,
    quoteValidityDays: org.quoteValidityDays,
    whatsappTemplates: parseWhatsappTemplates(org.whatsappTemplates),
  });
}, { roles: ["ADMIN", "MANAGER", "MECHANIC"] });

export const PATCH = withAuth(async (ctx, request) => {
  const parsed = await parseJson(request, updateOrganizationBrandingSchema);
  if ("error" in parsed) return parsed.error;
  const d = parsed.data;

  const updated = await organizationRepository.updateBranding(ctx.organizationId, {
    name: d.name,
    phone: emptyToNull(d.phone),
    email: emptyToNull(d.email),
    address: emptyToNull(d.address),
    quoteValidityDays: d.quoteValidityDays,
    whatsappTemplates: d.whatsappTemplates,
  });

  return apiSuccess({
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    phone: updated.phone,
    email: updated.email,
    address: updated.address,
    quoteValidityDays: updated.quoteValidityDays,
    whatsappTemplates: parseWhatsappTemplates(updated.whatsappTemplates),
  });
}, { roles: ["ADMIN"] });
