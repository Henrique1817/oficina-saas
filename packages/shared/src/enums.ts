export const USER_ROLES = ["ADMIN", "MANAGER", "MECHANIC"] as const;
export type UserRoleCode = (typeof USER_ROLES)[number];

export const SERVICE_ORDER_STATUSES = [
  "DRAFT",
  "APPROVED",
  "IN_PROGRESS",
  "DONE",
  "INVOICED",
  "CANCELLED",
] as const;

export const TOOL_STATUSES = ["AVAILABLE", "IN_USE", "MAINTENANCE"] as const;

export const INVENTORY_MOVEMENT_TYPES = [
  "IN",
  "OUT",
  "ADJUSTMENT",
  "OS_CONSUMPTION",
  "OS_RESERVATION",
  "OS_RELEASE",
] as const;
