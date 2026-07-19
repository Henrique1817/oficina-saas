"use server";

import { prisma, type Prisma } from "@oficina/database";
import { requirePlatformCapability } from "@/lib/session";
import { PlatformCapability } from "@/lib/roles";
import { revalidatePath } from "next/cache";

async function audit(
  actor: { userId: string; email: string },
  action: string,
  organizationId: string,
  metadata?: Prisma.InputJsonValue,
) {
  await prisma.platformAuditLog.create({
    data: {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action,
      organizationId,
      metadata: metadata ?? {},
    },
  });
}

export async function suspendOrganization(organizationId: string) {
  const actor = await requirePlatformCapability(PlatformCapability.tenantsWrite);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { suspendedAt: new Date() },
  });
  await audit(actor, "org.suspend", organizationId);
  revalidatePath("/oficinas");
  revalidatePath(`/oficinas/${organizationId}`);
}

export async function unsuspendOrganization(organizationId: string) {
  const actor = await requirePlatformCapability(PlatformCapability.tenantsWrite);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { suspendedAt: null },
  });
  await audit(actor, "org.unsuspend", organizationId);
  revalidatePath("/oficinas");
  revalidatePath(`/oficinas/${organizationId}`);
}

export async function extendTrial(organizationId: string, days: number) {
  const actor = await requirePlatformCapability(PlatformCapability.tenantsWrite);
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });
  const base =
    org.trialEndsAt && org.trialEndsAt.getTime() > Date.now()
      ? org.trialEndsAt
      : new Date();
  const trialEndsAt = new Date(base);
  trialEndsAt.setDate(trialEndsAt.getDate() + days);

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      planStatus: "TRIALING",
      trialEndsAt,
      pastDueAt: null,
    },
  });
  await audit(actor, "org.extend_trial", organizationId, {
    days,
    trialEndsAt: trialEndsAt.toISOString(),
  });
  revalidatePath("/oficinas");
  revalidatePath(`/oficinas/${organizationId}`);
}

export async function saveInternalNote(organizationId: string, note: string) {
  const actor = await requirePlatformCapability(PlatformCapability.tenantsWrite);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { internalNote: note.trim() || null },
  });
  await audit(actor, "org.note", organizationId);
  revalidatePath(`/oficinas/${organizationId}`);
}

export async function startImpersonation(organizationId: string, reason?: string) {
  const actor = await requirePlatformCapability(PlatformCapability.impersonate);
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const record = await prisma.platformImpersonationToken.create({
    data: {
      organizationId: org.id,
      actorUserId: actor.userId,
      actorEmail: actor.email,
      reason: reason?.trim() || null,
      expiresAt,
    },
  });

  await audit(actor, "impersonate.create_token", organizationId, {
    tokenId: record.id,
    reason: record.reason,
  });

  const webBase = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${webBase}/api/v1/platform/impersonate?token=${record.token}`;
}
