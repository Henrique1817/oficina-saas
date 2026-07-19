import { describe, expect, it } from "vitest";
import { upsertPipelineRunSchema, upsertPipelineStepSchema } from "./pipeline";

describe("pipeline schemas", () => {
  it("aceita upsert de run", () => {
    const parsed = upsertPipelineRunSchema.parse({
      externalId: "12345",
      workflow: "CI",
      status: "RUNNING",
      branch: "main",
      commitSha: "abc",
      event: "push",
      url: "https://github.com/org/repo/actions/runs/12345",
    });
    expect(parsed.provider).toBe("GITHUB_ACTIONS");
    expect(parsed.externalId).toBe("12345");
  });

  it("rejeita status inválido no step", () => {
    expect(() =>
      upsertPipelineStepSchema.parse({
        name: "lint",
        status: "DONE",
      }),
    ).toThrow();
  });

  it("aceita step com order e log", () => {
    const parsed = upsertPipelineStepSchema.parse({
      name: "typecheck",
      status: "SUCCESS",
      order: 2,
      logSummary: "ok",
      externalId: "99",
    });
    expect(parsed.order).toBe(2);
    expect(parsed.externalId).toBe("99");
  });
});
