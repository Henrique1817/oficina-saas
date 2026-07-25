import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildManifest,
  computeHmacHex,
  isTimestampWithinSkew,
  parseXSignature,
  safeEqualHex,
  validateMercadoPagoHmac,
} from "./hmac";
import {
  buildExternalReference,
  parseExternalReference,
  planAmountMatches,
  resolvePlan,
} from "./types";

describe("mercadopago hmac", () => {
  it("parses x-signature", () => {
    const parts = parseXSignature(
      "ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839",
    );
    expect(parts?.ts).toBe("1704908010");
    expect(parts?.v1).toHaveLength(64);
  });

  it("validates manifesto with timing-safe compare", () => {
    const secret = "test_webhook_secret";
    const dataId = "123456";
    const requestId = "req-abc";
    const ts = String(Math.floor(Date.now() / 1000));
    const manifest = buildManifest({ dataId, requestId, ts });
    const v1 = computeHmacHex(secret, manifest);

    const ok = validateMercadoPagoHmac({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: requestId,
      dataIdQuery: dataId,
      dataIdBody: dataId,
      secret,
    });
    expect(ok).toEqual({ ok: true });
  });

  it("rejects mismatched data.id between query and body", () => {
    const secret = "test_webhook_secret";
    const ts = String(Math.floor(Date.now() / 1000));
    const result = validateMercadoPagoHmac({
      xSignature: `ts=${ts},v1=${"ab".repeat(32)}`,
      xRequestId: "req",
      dataIdQuery: "1",
      dataIdBody: "2",
      secret,
    });
    expect(result).toEqual({ ok: false, reason: "data.id_mismatch" });
  });

  it("rejects skew > 300s", () => {
    expect(
      isTimestampWithinSkew(String(Math.floor(Date.now() / 1000) - 400)),
    ).toBe(false);
  });

  it("safeEqualHex rejects different lengths", () => {
    expect(safeEqualHex("aa", "aabb")).toBe(false);
    const a = createHmac("sha256", "s").update("m").digest("hex");
    expect(safeEqualHex(a, a)).toBe(true);
  });
});

describe("mercadopago plans", () => {
  it("resolves server-side amounts", () => {
    expect(resolvePlan("monthly").amountCents).toBe(9700);
    expect(resolvePlan("yearly").amountBrl).toBe(970);
  });

  it("matches amounts in BRL decimal", () => {
    expect(planAmountMatches(9700, 97)).toBe(true);
    expect(planAmountMatches(9700, "97.00")).toBe(true);
    expect(planAmountMatches(9700, 96)).toBe(false);
  });

  it("builds and parses external_reference", () => {
    const ref = buildExternalReference("clxyz123456789", "monthly");
    expect(ref.startsWith("sub_monthly_clxyz123456789_")).toBe(true);
    const parsed = parseExternalReference(ref);
    expect(parsed.planId).toBe("monthly");
    expect(parsed.organizationId).toBe("clxyz123456789");
  });
});
