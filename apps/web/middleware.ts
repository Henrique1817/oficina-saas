import { NextResponse, type NextRequest } from "next/server";
import { ORG_COOKIE, rolesForPath } from "@oficina/auth/roles";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@supabase/supabase-js";
import {
  GATE_COOKIE,
  GATE_TTL_SEC,
  decodeGate,
  encodeGate,
} from "@/lib/access-gate";
import {
  IMPERSONATE_COOKIE,
  decodeImpersonation,
  isPlatformAdminEmail,
} from "@/lib/impersonation";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/termos",
  "/privacidade",
  "/invite",
  "/api/v1/health",
  "/api/v1/cron/low-stock",
  "/api/v1/cron/trial-ending",
  "/api/v1/cron/dunning",
  "/api/v1/billing/webhook",
  "/api/v1/platform/impersonate",
];

const AUTH_ONLY_PATHS = ["/onboarding", "/billing"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/ajuda")) return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

type OrgRow = {
  slug: string;
  plan_status: string;
  trial_ends_at: string | null;
  past_due_at: string | null;
  suspended_at: string | null;
  billing_exempt?: boolean | null;
  stripe_subscription_id: string | null;
};

type MembershipRow = {
  role: string;
  active: boolean;
  organization: OrgRow | OrgRow[] | null;
};

function orgOf(m: MembershipRow) {
  const org = m.organization;
  if (!org) return undefined;
  return Array.isArray(org) ? org[0] : org;
}

const PAST_DUE_GRACE_DAYS = 3;

function hasPlanAccess(org: {
  plan_status?: string;
  plan?: string;
  trial_ends_at?: string | null;
  trial?: string | null;
  past_due_at?: string | null;
  pastDue?: string | null;
  suspended_at?: string | null;
  suspended?: boolean;
  billing_exempt?: boolean | null;
  exempt?: boolean;
}): boolean {
  if (org.suspended_at || org.suspended) return false;
  if (org.billing_exempt || org.exempt) return true;
  const plan = org.plan_status ?? org.plan ?? "";
  const trialEnds = org.trial_ends_at ?? org.trial ?? null;
  const pastDueAt = org.past_due_at ?? org.pastDue ?? null;

  if (plan === "ACTIVE") return true;
  if (plan === "TRIALING") {
    if (trialEnds && new Date(trialEnds).getTime() < Date.now()) return false;
    return true;
  }
  if (plan === "PAST_DUE") {
    const since = pastDueAt ? new Date(pastDueAt).getTime() : Date.now();
    const graceMs = PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - since < graceMs;
  }
  return false;
}

function setGateCookie(res: NextResponse, token: string) {
  res.cookies.set(GATE_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: GATE_TTL_SEC,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    if (pathname.startsWith("/api")) return NextResponse.next();
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  const { user, supabaseResponse } = await updateSession(request);

  if (!user) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    return supabaseResponse;
  }

  if (
    pathname.startsWith("/api/v1/billing/") ||
    pathname.startsWith("/api/v1/organizations/signup") ||
    pathname.startsWith("/api/v1/invites/accept")
  ) {
    return supabaseResponse;
  }

  const requiredRoles = rolesForPath(pathname);
  if (!requiredRoles) {
    return supabaseResponse;
  }

  // Impersonação: OWNER/SUPPORT (ou allowlist) entra como ADMIN da org
  if (user.email && request.cookies.get(IMPERSONATE_COOKIE)?.value) {
    let canImpersonate = isPlatformAdminEmail(user.email);
    if (!canImpersonate) {
      const svc = getServiceClient();
      if (svc) {
        const { data: pu } = await svc
          .from("platform_users")
          .select("role, active")
          .eq("email", user.email.toLowerCase())
          .maybeSingle();
        canImpersonate = Boolean(
          pu?.active && (pu.role === "OWNER" || pu.role === "SUPPORT"),
        );
      }
    }
    if (canImpersonate) {
      const imp = await decodeImpersonation(
        request.cookies.get(IMPERSONATE_COOKIE)?.value,
        user.id,
      );
      if (imp && requiredRoles.includes("ADMIN" as never)) {
        return supabaseResponse;
      }
    }
  }

  const cookieSlug = request.cookies.get(ORG_COOKIE)?.value;
  const cached = await decodeGate(request.cookies.get(GATE_COOKIE)?.value, user.id);

  if (
    cached &&
    requiredRoles.includes(cached.role as never) &&
    (!cookieSlug || cookieSlug === cached.slug) &&
    hasPlanAccess({
      plan: cached.plan,
      trial: cached.trial,
      pastDue: cached.pastDue,
      suspended: cached.suspended,
      exempt: cached.exempt,
    })
  ) {
    return supabaseResponse;
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return supabaseResponse;
  }

  const { data: rows } = await supabase
    .from("memberships")
    .select(
      "role, active, organization:organizations(slug, plan_status, trial_ends_at, past_due_at, suspended_at, billing_exempt, stripe_subscription_id)",
    )
    .eq("user_id", user.id)
    .eq("active", true);

  const memberships = (rows ?? []) as unknown as MembershipRow[];
  let membership =
    (cookieSlug ? memberships.find((m) => orgOf(m)?.slug === cookieSlug) : undefined) ??
    memberships[0];

  if (!membership) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  if (!requiredRoles.includes(membership.role as never)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  const org = orgOf(membership);
  if (org && !hasPlanAccess(org)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Subscription required" }, { status: 402 });
    }
    const url = request.nextUrl.clone();
    url.pathname = org.suspended_at ? "/unauthorized" : "/billing";
    return NextResponse.redirect(url);
  }

  const slug = org?.slug;
  if (slug && slug !== cookieSlug) {
    supabaseResponse.cookies.set(ORG_COOKIE, slug, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  if (org && slug) {
    const token = await encodeGate({
      uid: user.id,
      role: membership.role,
      slug,
      plan: org.plan_status,
      trial: org.trial_ends_at,
      pastDue: org.past_due_at,
      suspended: Boolean(org.suspended_at),
      exempt: Boolean(org.billing_exempt),
      exp: Math.floor(Date.now() / 1000) + GATE_TTL_SEC,
    });
    setGateCookie(supabaseResponse, token);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
