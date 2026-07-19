import { createClient } from "@supabase/supabase-js";
import { isAllowlistEmail } from "@/lib/roles";

/**
 * Acesso ao console: `platform_users.active` OU allowlist (bootstrap).
 * Usado no middleware Edge via service role.
 */
export async function resolvePlatformAccess(
  email: string | null | undefined,
): Promise<{ ok: boolean; role: string | null }> {
  if (!email) return { ok: false, role: null };
  const normalized = email.toLowerCase();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await supabase
        .from("platform_users")
        .select("role, active")
        .eq("email", normalized)
        .maybeSingle();
      if (data?.active) {
        return { ok: true, role: data.role as string };
      }
      // Convite existe mas inactive → negar mesmo se allowlist
      if (data && data.active === false) {
        return { ok: false, role: null };
      }
    } catch {
      // fallback allowlist abaixo
    }
  }

  if (isAllowlistEmail(normalized)) {
    return { ok: true, role: "OWNER" };
  }
  return { ok: false, role: null };
}

/** @deprecated use resolvePlatformAccess — mantido para imports pontuais */
export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  return isAllowlistEmail(email);
}
