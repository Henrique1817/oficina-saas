import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma, type Profile, type UserRole, type PlanStatus } from "@oficina/database";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  IMPERSONATE_COOKIE,
  decodeImpersonation,
} from "@/lib/impersonation";
import { canPlatformImpersonate } from "@/lib/platform-operator";

const ORG_COOKIE = "oficina_org";

const orgSelect = {
  id: true,
  slug: true,
  name: true,
  planStatus: true,
  trialEndsAt: true,
  pastDueAt: true,
  suspendedAt: true,
  billingExempt: true,
} as const;

export type SessionOrganization = {
  id: string;
  slug: string;
  name: string;
  planStatus: PlanStatus;
  trialEndsAt: Date | null;
  pastDueAt: Date | null;
  suspendedAt: Date | null;
  billingExempt: boolean;
};

export type SessionContext = {
  profile: Profile;
  organizationId: string;
  organizationSlug: string;
  role: UserRole;
  organization: SessionOrganization;
  impersonating?: boolean;
};

export const getProfileOrRedirect = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile) {
    const email = (user.email ?? "").trim().toLowerCase();
    profile = await prisma.profile.create({
      data: {
        id: user.id,
        email,
        fullName: user.user_metadata?.full_name ?? email.split("@")[0] ?? "Usuário",
        role: "MECHANIC",
      },
    });
  }
  if (!profile.active) redirect("/login");
  return profile;
});

export const getSessionOrRedirect = cache(async (): Promise<SessionContext> => {
  const profile = await getProfileOrRedirect();
  const cookieStore = await cookies();

  // Impersonação ativa (console → web)
  if (await canPlatformImpersonate(profile.email)) {
    const imp = await decodeImpersonation(
      cookieStore.get(IMPERSONATE_COOKIE)?.value,
      profile.id,
    );
    if (imp) {
      const org = await prisma.organization.findUnique({
        where: { id: imp.orgId },
        select: orgSelect,
      });
      if (org && org.slug === imp.slug) {
        return {
          profile,
          organizationId: org.id,
          organizationSlug: org.slug,
          role: "ADMIN",
          organization: org,
          impersonating: true,
        };
      }
    }
  }

  const cookieSlug = cookieStore.get(ORG_COOKIE)?.value;

  const membership = cookieSlug
    ? await prisma.membership.findFirst({
        where: {
          userId: profile.id,
          active: true,
          organization: { slug: cookieSlug },
        },
        include: { organization: { select: orgSelect } },
      })
    : null;

  const resolved =
    membership ??
    (await prisma.membership.findFirst({
      where: { userId: profile.id, active: true },
      include: { organization: { select: orgSelect } },
      orderBy: { createdAt: "asc" },
    }));

  if (!resolved) redirect("/onboarding");

  if (cookieSlug !== resolved.organization.slug) {
    cookieStore.set(ORG_COOKIE, resolved.organization.slug, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return {
    profile,
    organizationId: resolved.organizationId,
    organizationSlug: resolved.organization.slug,
    role: resolved.role,
    organization: resolved.organization,
  };
});

export function canManageServiceOrders(role: UserRole): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
