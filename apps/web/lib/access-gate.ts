/** Gate cookie helpers — Web Crypto (Edge-compatible for middleware). */

export const GATE_COOKIE = "oficina_gate";
/** TTL curto: evita hit no PostgREST a cada clique */
export const GATE_TTL_SEC = 90;

export type GatePayload = {
  uid: string;
  role: string;
  slug: string;
  plan: string;
  trial: string | null;
  pastDue: string | null;
  suspended?: boolean;
  exempt?: boolean;
  exp: number;
};

function secretBytes() {
  const s =
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "oficina-dev-gate";
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

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    secretBytes(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(body: string) {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return b64urlFromBytes(sig);
}

export async function encodeGate(payload: GatePayload): Promise<string> {
  const body = b64urlFromString(JSON.stringify(payload));
  const sig = await sign(body);
  return `${body}.${sig}`;
}

export async function decodeGate(
  token: string | undefined,
  userId: string,
): Promise<GatePayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await sign(body);
  if (sig.length !== expected.length || sig !== expected) return null;
  try {
    const payload = JSON.parse(stringFromB64url(body)) as GatePayload;
    if (payload.uid !== userId) return null;
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
