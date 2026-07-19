import { NextResponse } from "next/server";
import { prisma } from "@oficina/database";
import { createClient } from "@/lib/supabase/server";
import {
  IMPERSONATE_COOKIE,
  IMPERSONATE_TTL_SEC,
  encodeImpersonation,
} from "@/lib/impersonation";
import { canPlatformImpersonate } from "@/lib/platform-operator";
import { ORG_COOKIE } from "@oficina/auth";

export const runtime = "nodejs";

/**
 * Consome token one-time gerado pelo console admin.
 * GET /api/v1/platform/impersonate?token=...
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !(await canPlatformImpersonate(user.email))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", `/api/v1/platform/impersonate?token=${token}`);
    return NextResponse.redirect(login);
  }

  const record = await prisma.platformImpersonationToken.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return NextResponse.redirect(new URL("/unauthorized?reason=impersonate_expired", request.url));
  }

  if (record.actorUserId !== user.id || record.actorEmail.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.redirect(new URL("/unauthorized?reason=impersonate_actor", request.url));
  }

  await prisma.platformImpersonationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  await prisma.platformAuditLog.create({
    data: {
      actorUserId: user.id,
      actorEmail: user.email,
      action: "impersonate.start",
      organizationId: record.organizationId,
      metadata: { reason: record.reason, tokenId: record.id },
    },
  });

  const cookieValue = await encodeImpersonation({
    orgId: record.organizationId,
    slug: record.organization.slug,
    actorUserId: user.id,
    exp: Math.floor(Date.now() / 1000) + IMPERSONATE_TTL_SEC,
  });

  const res = NextResponse.redirect(new URL("/workshop", request.url));
  res.cookies.set(ORG_COOKIE, record.organization.slug, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: IMPERSONATE_TTL_SEC,
  });
  res.cookies.set(IMPERSONATE_COOKIE, cookieValue, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: IMPERSONATE_TTL_SEC,
  });
  return res;
}
