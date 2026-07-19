import { prisma } from "@oficina/database";
import { isPlatformAdminEmail } from "@/lib/impersonation";

/** Impersonate no web: PlatformUser OWNER/SUPPORT ativo, ou allowlist (bootstrap). */
export async function canPlatformImpersonate(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase();
  const row = await prisma.platformUser.findUnique({ where: { email: normalized } });
  if (row) {
    return row.active && (row.role === "OWNER" || row.role === "SUPPORT");
  }
  return isPlatformAdminEmail(normalized);
}
