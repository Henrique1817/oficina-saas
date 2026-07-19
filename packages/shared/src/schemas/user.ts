import { z } from "zod";
import { USER_ROLES } from "../enums";

export const updateProfileRoleSchema = z.object({
  role: z.enum(USER_ROLES),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  active: z.boolean().optional(),
});

export type UpdateProfileRoleInput = z.infer<typeof updateProfileRoleSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
