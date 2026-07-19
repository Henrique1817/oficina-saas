/** Cookie de impersonação no domínio do `web` (após consume do token one-time). */

export const IMPERSONATE_COOKIE = "oficina_impersonate";
export const IMPERSONATE_TTL_SEC = 2 * 60 * 60; // 2h

export type ImpersonationPayload = {
  orgId: string;
  slug: string;
  actorUserId: string;
  exp: number;
};

function secretBytes() {
  const s =
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "oficina-dev-impersonate";
  return new TextEncoder().encode(s);
}

function b64urlFromBytes(bytes: ArrayBuffer | Uint8Array) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlFromString(str: string) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function stringFromB64url(b64: string) {
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const normalized = b64.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return decodeURIComponent(escape(atob(normalized)));
}

async function sign(body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return b64urlFromBytes(sig);
}

export async function encodeImpersonation(payload: ImpersonationPayload): Promise<string> {
  const body = b64urlFromString(JSON.stringify(payload));
  return `${body}.${await sign(body)}`;
}

export async function decodeImpersonation(
  token: string | undefined,
  userId: string,
): Promise<ImpersonationPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await sign(body);
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(stringFromB64url(body)) as ImpersonationPayload;
    if (payload.actorUserId !== userId) return null;
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
