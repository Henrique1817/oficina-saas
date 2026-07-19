import { z } from "zod";
import { INVENTORY_MOVEMENT_TYPES } from "../enums";

export const createPartSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  unitCost: z.number().min(0),
  unitPrice: z.number().min(0),
  minQuantity: z.number().int().min(0).default(0),
  variantIds: z.array(z.string().cuid()).optional(),
});

export const updatePartSchema = createPartSchema.partial();

export const stockMovementSchema = z.object({
  partId: z.string().cuid(),
  locationId: z.string().cuid(),
  type: z.enum(INVENTORY_MOVEMENT_TYPES),
  quantity: z.number().int().positive(),
  notes: z.string().max(500).optional(),
  reference: z.string().max(100).optional(),
});

export const partQuerySchema = z.object({
  q: z.string().optional(),
  variantId: z.string().cuid().optional(),
  lowStock: z.coerce.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
