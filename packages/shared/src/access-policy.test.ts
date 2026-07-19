import { describe, expect, it } from "vitest";
import { organizationHasAccess, PAST_DUE_GRACE_DAYS } from "./access-policy";

describe("organizationHasAccess", () => {
  it("blocks suspended even if active", () => {
    expect(
      organizationHasAccess({
        planStatus: "ACTIVE",
        trialEndsAt: null,
        suspendedAt: new Date(),
      }),
    ).toBe(false);
  });

  it("allows billingExempt when canceled", () => {
    expect(
      organizationHasAccess({
        planStatus: "CANCELED",
        trialEndsAt: null,
        billingExempt: true,
      }),
    ).toBe(true);
  });

  it("blocks expired trial", () => {
    expect(
      organizationHasAccess({
        planStatus: "TRIALING",
        trialEndsAt: new Date(Date.now() - 60_000),
      }),
    ).toBe(false);
  });

  it("allows past_due within grace", () => {
    expect(
      organizationHasAccess({
        planStatus: "PAST_DUE",
        trialEndsAt: null,
        pastDueAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }),
    ).toBe(true);
  });

  it("blocks past_due after grace", () => {
    const days = PAST_DUE_GRACE_DAYS + 1;
    expect(
      organizationHasAccess({
        planStatus: "PAST_DUE",
        trialEndsAt: null,
        pastDueAt: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      }),
    ).toBe(false);
  });
});
