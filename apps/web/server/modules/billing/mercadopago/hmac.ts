import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_SKEW_SEC = 300;

export type SignatureParts = {
  ts: string;
  v1: string;
};

/**
 * Parse `x-signature`: `ts=1704908010,v1=618c8534...`
 */
export function parseXSignature(header: string | null): SignatureParts | null {
  if (!header?.trim()) return null;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...rest] = p.trim().split("=");
      return [k?.trim() ?? "", rest.join("=").trim()];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return null;
  return { ts, v1 };
}

function toSeconds(tsRaw: string): number | null {
  const n = Number(tsRaw);
  if (!Number.isFinite(n) || n <= 0) return null;
  // ms se > 1e12
  return n > 1_000_000_000_000 ? Math.floor(n / 1000) : Math.floor(n);
}

export function isTimestampWithinSkew(
  tsRaw: string,
  nowSec = Math.floor(Date.now() / 1000),
  maxSkewSec = MAX_SKEW_SEC,
): boolean {
  const ts = toSeconds(tsRaw);
  if (ts === null) return false;
  return Math.abs(nowSec - ts) <= maxSkewSec;
}

/**
 * Manifesto oficial MP: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 */
export function buildManifest(input: {
  dataId: string;
  requestId: string;
  ts: string;
}): string {
  return `id:${input.dataId};request-id:${input.requestId};ts:${input.ts};`;
}

export function computeHmacHex(secret: string, manifest: string): string {
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export type HmacValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Valida origem do webhook Mercado Pago (HMAC + anti-replay).
 * Se query e body `data.id` existirem e divergirem → 401.
 */
export function validateMercadoPagoHmac(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataIdQuery: string | null | undefined;
  dataIdBody: string | null | undefined;
  secret: string;
  nowSec?: number;
}): HmacValidationResult {
  const dataIdQuery = input.dataIdQuery?.trim() || null;
  const dataIdBody = input.dataIdBody?.trim() || null;

  if (dataIdQuery && dataIdBody && dataIdQuery !== dataIdBody) {
    return { ok: false, reason: "data.id_mismatch" };
  }

  const dataId = dataIdQuery || dataIdBody;
  if (!dataId) return { ok: false, reason: "data.id_missing" };

  const requestId = input.xRequestId?.trim();
  if (!requestId) return { ok: false, reason: "x-request-id_missing" };

  const parts = parseXSignature(input.xSignature);
  if (!parts) return { ok: false, reason: "x-signature_invalid" };

  if (!isTimestampWithinSkew(parts.ts, input.nowSec)) {
    return { ok: false, reason: "timestamp_skew" };
  }

  const manifest = buildManifest({
    dataId,
    requestId,
    ts: parts.ts,
  });
  const expected = computeHmacHex(input.secret, manifest);
  if (!safeEqualHex(expected, parts.v1)) {
    return { ok: false, reason: "hmac_mismatch" };
  }

  return { ok: true };
}
