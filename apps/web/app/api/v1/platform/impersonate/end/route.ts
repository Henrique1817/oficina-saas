import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IMPERSONATE_COOKIE } from "@/lib/impersonation";
import { canPlatformImpersonate } from "@/lib/platform-operator";
import { prisma } from "@oficina/database";

export const runtime = "nodejs";

/** Encerra impersonação e volta à org “normal”. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !(await canPlatformImpersonate(user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.platformAuditLog.create({
    data: {
      actorUserId: user.id,
      actorEmail: user.email,
      action: "impersonate.end",
      metadata: {},
    },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(IMPERSONATE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
