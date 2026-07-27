import { createClient } from "@supabase/supabase-js";
import { prisma, type Profile, type UserRole } from "@oficina/database";
import { apiError, organizationHasAccess } from "@oficina/shared";
import type { AuthContext } from "./types";
import { hasRole, orgSlugFromCookieHeader } from "./roles";

export type WithAuthOptions = {
  roles?: UserRole[];
  /**
   * Permite a rota mesmo sem plano ativo (ex.: checkout / portal de assinatura).
   * Por padrão a API exige o mesmo gate das páginas.
   */
  allowWithoutPlan?: boolean;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase server configuration");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function resolveAuth(request: Request): Promise<AuthContext | null> {
  const userOnly = await resolveUserAuth(request);
  if (!userOnly) return null;

  const orgSlug =
    request.headers.get("x-oficina-org") ??
    orgSlugFromCookieHeader(request.headers.get("cookie"));

  let membership = orgSlug
    ? await prisma.membership.findFirst({
        where: {
          userId: userOnly.profile.id,
          active: true,
          organization: { slug: orgSlug },
        },
        include: { organization: true },
      })
    : null;

  if (!membership) {
    membership = await prisma.membership.findFirst({
      where: { userId: userOnly.profile.id, active: true },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!membership) return null;

  return {
    userId: userOnly.userId,
    email: userOnly.email,
    profile: userOnly.profile,
    role: membership.role,
    organizationId: membership.organizationId,
    organizationSlug: membership.organization.slug,
    organization: membership.organization,
    membership,
  };
}

export type UserAuthContext = {
  userId: string;
  email: string;
  profile: Profile;
};

/** Autentica o usuário sem exigir membership (ex.: aceitar convite). */
export async function resolveUserAuth(request: Request): Promise<UserAuthContext | null> {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!bearer) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(bearer);
  if (error || !data.user?.email) return null;

  let profile = await prisma.profile.findUnique({ where: { id: data.user.id } });
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name ?? data.user.email.split("@")[0],
        role: "MECHANIC",
      },
    });
  }
  if (!profile.active) return null;

  return { userId: data.user.id, email: data.user.email, profile };
}

export function withUserAuth(
  handler: (ctx: UserAuthContext, request: Request) => Promise<Response>,
) {
  return async (request: Request): Promise<Response> => {
    try {
      const auth = await resolveUserAuth(request);
      if (!auth) return apiError("Unauthorized", 401, "UNAUTHORIZED");
      return handler(auth, request);
    } catch (err) {
      console.error("[withUserAuth]", err);
      return apiError("Internal server error", 500, "INTERNAL_ERROR");
    }
  };
}

export function withAuth(
  handler: (ctx: AuthContext, request: Request) => Promise<Response>,
  options?: WithAuthOptions,
) {
  return async (request: Request): Promise<Response> => {
    try {
      const auth = await resolveAuth(request);
      if (!auth) return apiError("Unauthorized", 401, "UNAUTHORIZED");

      if (options?.roles && !hasRole(auth.role, options.roles)) {
        return apiError("Forbidden", 403, "FORBIDDEN");
      }

      if (!options?.allowWithoutPlan && !organizationHasAccess(auth.organization)) {
        return apiError(
          "Assinatura necessária ou acesso suspenso",
          402,
          "SUBSCRIPTION_REQUIRED",
        );
      }

      return handler(auth, request);
    } catch (err) {
      console.error("[withAuth]", err);
      return apiError("Internal server error", 500, "INTERNAL_ERROR");
    }
  };
}

export function requireMechanicOwnsOrder(
  auth: AuthContext,
  assignedMechanicId: string | null | undefined,
): boolean {
  if (auth.role === "ADMIN" || auth.role === "MANAGER") return true;
  return assignedMechanicId === auth.userId;
}

export type { Profile };
