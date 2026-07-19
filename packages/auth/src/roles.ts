import type { UserRole } from "@oficina/database";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 3,
  MANAGER: 2,
  MECHANIC: 1,
};

export function hasRole(userRole: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(userRole);
}

export function hasMinimumRole(userRole: UserRole, minimum: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimum];
}

export const ORG_COOKIE = "oficina_org";

export const ROUTE_ROLE_MAP: Record<string, UserRole[]> = {
  "/admin": ["ADMIN"],
  // Mecânicos podem cadastrar clientes e peças nas rotas /manager/*
  "/manager": ["ADMIN", "MANAGER", "MECHANIC"],
  "/workshop": ["ADMIN", "MANAGER", "MECHANIC"],
};

export function rolesForPath(pathname: string): UserRole[] | null {
  for (const [prefix, roles] of Object.entries(ROUTE_ROLE_MAP)) {
    if (pathname.startsWith(prefix)) return roles;
  }
  return null;
}

/** Extrai slug da org do header Cookie (API) ou valor direto. */
export function orgSlugFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)oficina_org=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
