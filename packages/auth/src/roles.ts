/**
 * Helpers de papel/rota — Edge-safe.
 * Não importe @oficina/database daqui (Prisma estoura o limite de 1 MB do middleware).
 */

export type AuthUserRole = "ADMIN" | "MANAGER" | "MECHANIC";

const ROLE_HIERARCHY: Record<AuthUserRole, number> = {
  ADMIN: 3,
  MANAGER: 2,
  MECHANIC: 1,
};

export function hasRole(userRole: AuthUserRole, allowed: AuthUserRole[]): boolean {
  return allowed.includes(userRole);
}

export function hasMinimumRole(userRole: AuthUserRole, minimum: AuthUserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimum];
}

export const ORG_COOKIE = "oficina_org";

export const ROUTE_ROLE_MAP: Record<string, AuthUserRole[]> = {
  "/admin": ["ADMIN"],
  // Mecânicos podem cadastrar clientes e peças nas rotas /manager/*
  "/manager": ["ADMIN", "MANAGER", "MECHANIC"],
  "/workshop": ["ADMIN", "MANAGER", "MECHANIC"],
};

export function rolesForPath(pathname: string): AuthUserRole[] | null {
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
