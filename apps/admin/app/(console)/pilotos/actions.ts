"use server";

import { prisma, type Prisma } from "@oficina/database";
import { requirePlatformCapability } from "@/lib/session";
import { PlatformCapability } from "@/lib/roles";
import { uniqueOrgSlug } from "@/lib/org-slug";
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

export type ProvisionPilotResult =
  | {
      ok: true;
      organizationId: string;
      slug: string;
      inviteUrl: string | null;
      membershipAttached: boolean;
    }
  | { ok: false; error: string };

/** Cria oficina piloto: cortesia + trial longo + convite ADMIN (sem Stripe). */
export async function provisionPilot(input: {
  name: string;
  ownerEmail: string;
  contact?: string;
  trialDays?: number;
}): Promise<ProvisionPilotResult> {
  const actor = await requirePlatformCapability(PlatformCapability.tenantsWrite);

  const name = input.name.trim();
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  const contact = input.contact?.trim() || null;
  const trialDays = Math.min(Math.max(input.trialDays ?? 90, 14), 365);

  if (name.length < 2) return { ok: false, error: "Nome da oficina obrigatório" };
  if (!ownerEmail.includes("@")) return { ok: false, error: "E-mail do dono inválido" };

  const cohortCount = await prisma.organization.count({ where: { designPartner: true } });
  if (cohortCount >= 8) {
    return {
      ok: false,
      error: "Cohort cheio (≥8). Remova um piloto antigo antes de adicionar.",
    };
  }

  await prisma.profile.upsert({
    where: { id: actor.userId },
    create: {
      id: actor.userId,
      email: actor.email,
      fullName: actor.email.split("@")[0] ?? "Platform",
      role: "ADMIN",
    },
    update: {},
  });

  const slug = await uniqueOrgSlug(name);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

  const ownerProfile = await prisma.profile.findUnique({ where: { email: ownerEmail } });

  const { org, inviteToken, membershipAttached } = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name,
        slug,
        planStatus: "TRIALING",
        trialEndsAt,
        billingExempt: true,
        designPartner: true,
        designPartnerContact: contact,
        internalNote: `Piloto soft launch · contato admin: ${ownerEmail}${
          contact ? ` · ${contact}` : ""
        }`,
      },
    });

    await tx.stockLocation.create({
      data: {
        organizationId: organization.id,
        name: "Oficina Principal",
        description: "Estoque geral",
      },
    });

    let token: string | null = null;
    let attached = false;

    if (ownerProfile) {
      await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: ownerProfile.id,
          role: "ADMIN",
          active: true,
        },
      });
      await tx.profile.update({
        where: { id: ownerProfile.id },
        data: { role: "ADMIN" },
      });
      attached = true;
    } else {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      const invite = await tx.organizationInvite.create({
        data: {
          organizationId: organization.id,
          email: ownerEmail,
          role: "ADMIN",
          invitedById: actor.userId,
          expiresAt,
        },
      });
      token = invite.token;
    }

    return { org: organization, inviteToken: token, membershipAttached: attached };
  });

  await audit(actor, "org.provision_pilot", org.id, {
    ownerEmail,
    trialDays,
    contact,
    membershipAttached,
  });

  revalidatePath("/pilotos");
  revalidatePath("/oficinas");

  const webBase = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return {
    ok: true,
    organizationId: org.id,
    slug: org.slug,
    inviteUrl: inviteToken ? `${webBase}/invite/${inviteToken}` : null,
    membershipAttached,
  };
}

export async function setDesignPartner(
  organizationId: string,
  designPartner: boolean,
  contact?: string | null,
) {
  const actor = await requirePlatformCapability(PlatformCapability.tenantsWrite);
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      designPartner,
      ...(contact !== undefined
        ? { designPartnerContact: contact?.trim() || null }
        : {}),
      ...(designPartner ? { billingExempt: true } : {}),
    },
  });
  await audit(actor, designPartner ? "org.mark_pilot" : "org.unmark_pilot", organizationId, {
    contact,
  });
  revalidatePath("/pilotos");
  revalidatePath("/oficinas");
  revalidatePath(`/oficinas/${organizationId}`);
}
