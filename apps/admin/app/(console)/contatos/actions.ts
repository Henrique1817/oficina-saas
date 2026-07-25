"use server";

import { revalidatePath } from "next/cache";
import { prisma, type ContactLeadStatus } from "@oficina/database";
import { requirePlatformSession } from "@/lib/session";

export async function markContactLeadStatus(formData: FormData) {
  await requirePlatformSession();

  const id = String(formData.get("id") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim().toUpperCase();
  const status =
    statusRaw === "NEW" || statusRaw === "CONTACTED" || statusRaw === "ARCHIVED"
      ? (statusRaw as ContactLeadStatus)
      : null;

  if (!id || !status) return;

  await prisma.contactLead.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/contatos");
}
