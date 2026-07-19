import { z } from "zod";

export const createVehicleVariantSchema = z.object({
  make: z.string().min(1).max(80),
  model: z.string().min(1).max(80),
  yearStart: z.number().int().min(1900).max(2100).optional(),
  yearEnd: z.number().int().min(1900).max(2100).optional(),
  engine: z.string().max(80).optional(),
  transmission: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
});

export const createVehicleSchema = z.object({
  customerId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  plate: z.string().min(5).max(15),
  vehicleModel: z.string().min(1).max(120),
  vehicleYear: z.number().int().min(1900).max(2100).optional(),
  color: z.string().max(40).optional(),
  reportedIssue: z.string().max(8000).optional(),
  vin: z.string().max(30).optional(),
  mileage: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateVehicleSchema = createVehicleSchema
  .omit({ customerId: true })
  .partial()
  .extend({ customerId: z.string().cuid().optional() });

export type CreateVehicleVariantInput = z.infer<typeof createVehicleVariantSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
