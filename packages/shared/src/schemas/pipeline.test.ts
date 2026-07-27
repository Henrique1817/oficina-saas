import { describe, expect, it } from "vitest";
import { upsertPipelineRunSchema, upsertPipelineStepSchema } from "./pipeline";

describe("upsertPipelineRunSchema", () => {
  it("accepts a minimal valid run", () => {
    const parsed = upsertPipelineRunSchema.parse({
      externalId: "123456",
      workflow: "CI",
      status: "RUNNING",
    });
    expect(parsed.provider).toBe("GITHUB_ACTIONS");
    expect(parsed.externalId).toBe("123456");
  });

  it("rejects invalid status", () => {
    expect(() =>
      upsertPipelineRunSchema.parse({
        externalId: "1",
        workflow: "CI",
        status: "DONE",
      }),
    ).toThrow();
  });
});

describe("upsertPipelineStepSchema", () => {
  it("accepts a step payload", () => {
    const parsed = upsertPipelineStepSchema.parse({
      name: "lint",
      stepOrder: 1,
      status: "SUCCESS",
      logSummary: "ok",
    });
    expect(parsed.name).toBe("lint");
    expect(parsed.stepOrder).toBe(1);
  });
});
