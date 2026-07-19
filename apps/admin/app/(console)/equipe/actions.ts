"use server";

import { prisma, type PlatformRole } from "@oficina/database";
import { requirePlatformCapability, requirePlatformSession } from "@/lib/session";
import { PlatformCapability } from "@/lib/roles";
import { revalidatePath } from "next/cache";

const ROLES: PlatformRole[] = ["OWNER", "SUPPORT", "FINANCE", "VIEWER"];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function invitePlatformMember(email: string, role: PlatformRole) {
  const actor = await requirePlatformCapability(PlatformCapability.manageTeam);
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) throw new Error("E-mail inválido");
  if (!ROLES.includes(role)) throw new Error("Role inválida");

  const existing = await prisma.platformUser.findUnique({ where: { email: normalized } });
  if (existing) {
    if (existing.active) throw new Error("Este e-mail já está na equipe");
    await prisma.platformUser.update({
      where: { id: existing.id },
      data: {
        active: true,
        role,
        invitedByEmail: actor.email,
      },
    });
  } else {
    await prisma.platformUser.create({
      data: {
        email: normalized,
        role,
        active: true,
        invitedByEmail: actor.email,
      },
    });
  }

  await prisma.platformAuditLog.create({
    data: {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action: "team.invite",
      metadata: { email: normalized, role },
    },
  });

  revalidatePath("/equipe");
}

export async function updatePlatformMemberRole(memberId: string, role: PlatformRole) {
  const actor = await requirePlatformCapability(PlatformCapability.manageTeam);
  if (!ROLES.includes(role)) throw new Error("Role inválida");

  const member = await prisma.platformUser.findUniqueOrThrow({ where: { id: memberId } });
  if (member.role === "OWNER" && role !== "OWNER") {
    const owners = await prisma.platformUser.count({
      where: { role: "OWNER", active: true },
    });
    if (owners <= 1) throw new Error("Não é possível rebaixar o último OWNER");
  }

  await prisma.platformUser.update({
    where: { id: memberId },
    data: { role },
  });

  await prisma.platformAuditLog.create({
    data: {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action: "team.role_change",
      metadata: { memberId, email: member.email, role },
    },
  });

  revalidatePath("/equipe");
}

export async function setPlatformMemberActive(memberId: string, active: boolean) {
  const actor = await requirePlatformCapability(PlatformCapability.manageTeam);
  const member = await prisma.platformUser.findUniqueOrThrow({ where: { id: memberId } });

  if (!active && member.role === "OWNER") {
    const owners = await prisma.platformUser.count({
      where: { role: "OWNER", active: true },
    });
    if (owners <= 1) throw new Error("Não é possível desativar o último OWNER");
  }

  if (!active && member.email.toLowerCase() === actor.email.toLowerCase()) {
    throw new Error("Não é possível desativar a si mesmo");
  }

  await prisma.platformUser.update({
    where: { id: memberId },
    data: { active },
  });

  await prisma.platformAuditLog.create({
    data: {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action: active ? "team.activate" : "team.deactivate",
      metadata: { memberId, email: member.email },
    },
  });

  revalidatePath("/equipe");
}

export async function listPlatformMembers() {
  await requirePlatformSession();
  return prisma.platformUser.findMany({
    orderBy: [{ active: "desc" }, { role: "asc" }, { email: "asc" }],
  });
}
