import { z } from "zod";

export const billingIntervalSchema = z.enum(["monthly", "yearly"]);

export const checkoutBodySchema = z.object({
  interval: billingIntervalSchema.default("monthly"),
  termsAccepted: z.boolean().optional(),
  legalVersion: z.string().optional(),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;

/** Query do webhook MP (`data.id` / `type` / `topic`). */
export const webhookQuerySchema = z.object({
  "data.id": z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  type: z.string().optional(),
  topic: z.string().optional(),
  action: z.string().optional(),
});

/** Body JSON do webhook. */
export const webhookBodySchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    live_mode: z.boolean().optional(),
    type: z.string().optional(),
    topic: z.string().optional(),
    action: z.string().optional(),
    api_version: z.string().optional(),
    date_created: z.string().optional(),
    user_id: z.union([z.string(), z.number()]).optional(),
    data: z
      .object({
        id: z.union([z.string(), z.number()]),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type WebhookBody = z.infer<typeof webhookBodySchema>;
export type WebhookQuery = z.infer<typeof webhookQuerySchema>;

export function coerceId(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}
