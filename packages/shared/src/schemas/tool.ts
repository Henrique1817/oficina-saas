import { z } from "zod";
import { TOOL_STATUSES } from "../enums";

export const createToolSchema = z.object({
  assetCode: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const updateToolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(TOOL_STATUSES).optional(),
});

export const toolCheckoutSchema = z.object({
  toolId: z.string().cuid(),
  serviceOrderId: z.string().cuid().optional(),
  notes: z.string().max(500).optional(),
});

export const toolReturnSchema = z.object({
  checkoutId: z.string().cuid(),
  notes: z.string().max(500).optional(),
});

export const toolMaintenanceSchema = z.object({
  toolId: z.string().cuid(),
  scheduledAt: z.coerce.date(),
  description: z.string().min(3).max(2000),
  cost: z.number().min(0).optional(),
});

export type CreateToolInput = z.infer<typeof createToolSchema>;
export type ToolCheckoutInput = z.infer<typeof toolCheckoutSchema>;
