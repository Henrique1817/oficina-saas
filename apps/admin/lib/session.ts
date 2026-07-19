import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma, type PlatformRole } from "@oficina/database";
import { redirect } from "next/navigation";
import {
  hasCapability,
  isAllowlistEmail,
  type PlatformCapability,
} from "@/lib/roles";

export type PlatformSession = {
  userId: string;
  email: string;
  fullName: string;
  role: PlatformRole;
  platformUserId: string;
};

async function ensurePlatformUser(
  userId: string,
  email: string,
): Promise<{ id: string; role: PlatformRole; active: boolean } | null> {
  const normalized = email.toLowerCase();

  let row = await prisma.platformUser.findUnique({ where: { email: normalized } });

  if (!row && isAllowlistEmail(normalized)) {
    row = await prisma.platformUser.create({
      data: {
        email: normalized,
        userId,
        role: "OWNER",
        active: true,
        invitedByEmail: "bootstrap:PLATFORM_ADMIN_EMAILS",
      },
    });
  }

  if (!row) return null;
  if (!row.active) return null;

  if (row.userId !== userId) {
    row = await prisma.platformUser.update({
      where: { id: row.id },
      data: { userId },
    });
  }

  return { id: row.id, role: row.role, active: row.active };
}

export const requirePlatformSession = cache(async (): Promise<PlatformSession> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login");

  const member = await ensurePlatformUser(user.id, user.email);
  if (!member) redirect("/unauthorized");

  return {
    userId: user.id,
    email: user.email,
    fullName:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email.split("@")[0] ??
      "Admin",
    role: member.role,
    platformUserId: member.id,
  };
});

export async function requirePlatformCapability(capability: PlatformCapability) {
  const session = await requirePlatformSession();
  if (!hasCapability(session.role, capability)) {
    throw new Error("Sem permissão para esta ação");
  }
  return session;
}
