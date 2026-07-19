import { z } from "zod";

export const createOrganizationSignupSchema = z.object({
  name: z.string().min(2).max(120),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export type CreateOrganizationSignupInput = z.infer<
  typeof createOrganizationSignupSchema
>;
