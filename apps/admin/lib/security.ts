import type { NextRequest } from "next/server";

/** Janela e teto para POST/ações sensíveis e login. */
const WINDOW_MS = 60_000;
const MAX_HITS = 60;
const LOGIN_MAX = 20;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function take(key: string, max: number): boolean {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  b.count += 1;
  // Evita crescimento infinito em dev
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k);
    }
  }
  return b.count <= max;
}

export function rateLimitOk(request: NextRequest): boolean {
  const ip = clientIp(request);
  const path = request.nextUrl.pathname;
  const isLogin = path === "/login" && request.method === "POST";
  // Middleware vê sobretudo GET de páginas; limita por IP globalmente
  const max = isLogin || path.startsWith("/login") ? LOGIN_MAX : MAX_HITS;
  return take(`${ip}:${path.split("/")[1] || "root"}`, max);
}

/**
 * Allowlist opcional: se `PLATFORM_ADMIN_IPS` estiver definido,
 * só esses IPs (vírgula) acessam o console.
 */
export function ipAllowlistOk(request: NextRequest): boolean {
  const raw = process.env.PLATFORM_ADMIN_IPS?.trim();
  if (!raw) return true;
  const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (allowed.length === 0) return true;
  const ip = clientIp(request);
  return allowed.includes(ip) || allowed.includes("*");
}

export { clientIp };
