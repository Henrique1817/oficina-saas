"use server";

import { prisma } from "@oficina/database";
import { requirePlatformCapability } from "@/lib/session";
import { PlatformCapability } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export async function setBillingExempt(organizationId: string, exempt: boolean) {
  const actor = await requirePlatformCapability(PlatformCapability.billingWrite);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { billingExempt: exempt },
  });
  await prisma.platformAuditLog.create({
    data: {
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action: exempt ? "org.billing_exempt_on" : "org.billing_exempt_off",
      organizationId,
      metadata: { billingExempt: exempt },
    },
  });
  revalidatePath("/pagamentos");
  revalidatePath("/oficinas");
  revalidatePath(`/oficinas/${organizationId}`);
}
