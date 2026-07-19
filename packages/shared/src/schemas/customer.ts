import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  document: z.string().max(30).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
