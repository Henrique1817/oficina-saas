import { z } from "zod";
import { SERVICE_ORDER_STATUSES } from "../enums";

const optionalDate = z
  .union([z.coerce.date(), z.null()])
  .optional()
  .transform((v) => (v === undefined ? undefined : v));

export const createServiceOrderSchema = z.object({
  customerId: z.string().cuid(),
  vehicleId: z.string().cuid(),
  assignedMechanicId: z.string().uuid().optional().nullable(),
  description: z.string().max(5000).optional(),
  internalNotes: z.string().max(5000).optional(),
  dueAt: optionalDate,
});

export const updateServiceOrderSchema = z.object({
  assignedMechanicId: z.string().uuid().nullable().optional(),
  description: z.string().max(5000).optional().nullable(),
  internalNotes: z.string().max(5000).optional().nullable(),
  dueAt: optionalDate,
  discount: z.number().min(0).optional(),
});

export const serviceOrderLineSchema = z
  .object({
    type: z.enum(["PART", "SERVICE"]),
    partId: z.string().cuid().optional(),
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
  })
  .refine((data) => data.type !== "PART" || !!data.partId, {
    message: "partId é obrigatório para linhas do tipo PART",
    path: ["partId"],
  });

export const serviceOrderLaborSchema = z.object({
  mechanicId: z.string().uuid(),
  description: z.string().min(1).max(500),
  minutes: z.number().int().positive(),
  hourlyRate: z.number().min(0),
});

export const transitionServiceOrderSchema = z.object({
  status: z.enum(SERVICE_ORDER_STATUSES),
  notes: z.string().max(1000).optional(),
});

export const serviceOrderQuoteActionSchema = z.object({
  action: z.enum(["send", "approve", "reject"]),
  notes: z.string().max(2000).optional(),
});

export const authorizeServiceOrderSchema = z.object({
  signedBy: z.string().min(2).max(120),
  notes: z.string().max(2000).optional(),
  method: z.enum(["digital", "print"]).default("digital"),
});

export const serviceOrderQuerySchema = z.object({
  status: z.enum(SERVICE_ORDER_STATUSES).optional(),
  mechanicId: z.string().uuid().optional(),
  customerId: z.string().cuid().optional(),
  /** Filtros de agenda / prazo */
  due: z.enum(["today", "overdue"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;
export type UpdateServiceOrderInput = z.infer<typeof updateServiceOrderSchema>;
export type TransitionServiceOrderInput = z.infer<typeof transitionServiceOrderSchema>;
export type ServiceOrderLineInput = z.infer<typeof serviceOrderLineSchema>;
export type ServiceOrderLaborInput = z.infer<typeof serviceOrderLaborSchema>;
export type ServiceOrderQuoteActionInput = z.infer<typeof serviceOrderQuoteActionSchema>;
export type AuthorizeServiceOrderInput = z.infer<typeof authorizeServiceOrderSchema>;
