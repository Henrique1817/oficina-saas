import { z } from "zod";
import { USER_ROLES } from "../enums";

export const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(USER_ROLES).default("MECHANIC"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(8),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
