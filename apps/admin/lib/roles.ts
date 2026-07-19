import type { PlatformRole } from "@oficina/database";

export type { PlatformRole };

export const PLATFORM_ROLE_LABEL: Record<PlatformRole, string> = {
  OWNER: "Owner",
  SUPPORT: "Suporte",
  FINANCE: "Financeiro",
  VIEWER: "Viewer",
};

/** Capacidades do console (Fase D). */
export const PlatformCapability = {
  manageTeam: "manageTeam",
  tenantsWrite: "tenantsWrite",
  billingWrite: "billingWrite",
  impersonate: "impersonate",
} as const;

export type PlatformCapability =
  (typeof PlatformCapability)[keyof typeof PlatformCapability];

const ROLE_CAPS: Record<PlatformRole, ReadonlySet<PlatformCapability>> = {
  OWNER: new Set([
    PlatformCapability.manageTeam,
    PlatformCapability.tenantsWrite,
    PlatformCapability.billingWrite,
    PlatformCapability.impersonate,
  ]),
  SUPPORT: new Set([
    PlatformCapability.tenantsWrite,
    PlatformCapability.impersonate,
  ]),
  FINANCE: new Set([PlatformCapability.billingWrite]),
  VIEWER: new Set(),
};

export function hasCapability(
  role: PlatformRole,
  capability: PlatformCapability,
): boolean {
  return ROLE_CAPS[role]?.has(capability) ?? false;
}

export function allowlistEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowlistEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowlistEmails().includes(email.toLowerCase());
}
