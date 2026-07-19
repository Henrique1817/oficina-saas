import { z } from "zod";

export const createOrganizationSignupSchema = z.object({
  name: z.string().min(2).max(120),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const whatsappTemplateSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(80),
  body: z.string().min(1).max(2000),
});

export const updateOrganizationBrandingSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().max(40).optional().nullable(),
  email: z.union([z.string().email().max(200), z.literal("")]).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  quoteValidityDays: z.number().int().min(1).max(90).optional(),
  whatsappTemplates: z.array(whatsappTemplateSchema).max(12).optional(),
});

export type CreateOrganizationSignupInput = z.infer<
  typeof createOrganizationSignupSchema
>;
export type WhatsappTemplate = z.infer<typeof whatsappTemplateSchema>;
export type UpdateOrganizationBrandingInput = z.infer<
  typeof updateOrganizationBrandingSchema
>;
