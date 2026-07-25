import { prisma } from "@oficina/database";

export type ClaimStatus = "processing" | "done" | "failed";

/**
 * Claim atômico por id de pagamento/cobrança/preapproval.
 * Retorna `claimed: false` se já existe (já processado ou em andamento).
 */
export async function claimWebhookEvent(input: {
  claimKey: string;
  topic?: string;
}): Promise<{ claimed: boolean; status: ClaimStatus }> {
  try {
    const row = await prisma.billingWebhookClaim.create({
      data: {
        claimKey: input.claimKey,
        status: "processing",
        topic: input.topic ?? null,
      },
    });
    return { claimed: true, status: row.status as ClaimStatus };
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    if (code === "P2002") {
      const existing = await prisma.billingWebhookClaim.findUnique({
        where: { claimKey: input.claimKey },
      });
      return {
        claimed: false,
        status: (existing?.status as ClaimStatus) ?? "done",
      };
    }
    throw err;
  }
}

export async function finalizeWebhookClaim(
  claimKey: string,
  status: "done" | "failed",
  meta?: unknown,
) {
  return prisma.billingWebhookClaim.update({
    where: { claimKey },
    data: {
      status,
      ...(meta !== undefined ? { meta: meta as object } : {}),
    },
  });
}

/** Libera claim para retry seguro após falha de fulfill. */
export async function releaseWebhookClaim(claimKey: string) {
  try {
    await prisma.billingWebhookClaim.delete({ where: { claimKey } });
  } catch {
    // já removido / inexistente
  }
}
