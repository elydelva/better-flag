import { describe, expect, test } from "bun:test";
import type { EvaluationContext, Flag } from "@better-flag/types";
import { evaluateFlag } from "./evaluate.js";

function makeFlag(
  overrides: Partial<Flag> & { key: string; type: Flag["type"]; defaultValue: Flag["defaultValue"] }
): Flag {
  return {
    key: overrides.key,
    type: overrides.type,
    defaultValue: overrides.defaultValue,
    variants: overrides.variants,
    enabled: overrides.enabled,
    description: overrides.description,
    rollout: overrides.rollout,
    schedule: overrides.schedule,
    rules: overrides.rules,
    metadata: overrides.metadata,
  };
}

describe("evaluateFlag", () => {
  describe("disabled", () => {
    test("returns defaultValue with reason disabled when enabled is false", () => {
      const flag = makeFlag({
        key: "f1",
        type: "boolean",
        defaultValue: true,
        enabled: false,
      });
      const result = evaluateFlag(flag, {});
      expect(result.value).toBe(true);
      expect(result.reason).toEqual({ kind: "disabled" });
    });

    test("returns defaultValue when enabled is explicitly false even with rollout", () => {
      const flag = makeFlag({
        key: "f1",
        type: "boolean",
        defaultValue: false,
        enabled: false,
        rollout: { percentage: 100, seed: "x" },
      });
      const result = evaluateFlag(flag, { userId: "u1" });
      expect(result.value).toBe(false);
      expect(result.reason).toEqual({ kind: "disabled" });
    });
  });

  describe("schedule", () => {
    test("returns schedule reason when now is before start", () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const flag = makeFlag({
        key: "f1",
        type: "boolean",
        defaultValue: false,
        enabled: true,
        schedule: { start: future },
      });
      const result = evaluateFlag(flag, {});
      expect(result.value).toBe(false);
      expect(result.reason).toEqual({ kind: "schedule", active: false });
    });

    test("returns schedule reason when now is after end", () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const flag = makeFlag({
        key: "f1",
        type: "boolean",
        defaultValue: false,
        enabled: true,
        schedule: { end: past },
      });
      const result = evaluateFlag(flag, {});
      expect(result.value).toBe(false);
      expect(result.reason).toEqual({ kind: "schedule", active: false });
    });

    test("returns default when within schedule window", () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      const future = new Date(Date.now() + 86400000).toISOString();
      const flag = makeFlag({
        key: "f1",
        type: "boolean",
        defaultValue: true,
        enabled: true,
        schedule: { start: past, end: future },
      });
      const result = evaluateFlag(flag, {});
      expect(result.value).toBe(true);
      expect(result.reason).toEqual({ kind: "default" });
    });
  });

  describe("rollout", () => {
    test("returns rollout value when userId in bucket and percentage 100", () => {
      const flag = makeFlag({
        key: "f1",
        type: "boolean",
        defaultValue: false,
        enabled: true,
        rollout: { percentage: 100 },
      });
      const result = evaluateFlag(flag, { userId: "u1" });
      expect(result.reason).toEqual({ kind: "rollout", percentage: 100 });
      expect(typeof result.value).toBe("boolean");
    });

    test("returns default when rollout percentage 0", () => {
      const flag = makeFlag({
        key: "f1",
        type: "boolean",
        defaultValue: true,
        enabled: true,
        rollout: { percentage: 0 },
      });
      const result = evaluateFlag(flag, { userId: "u1" });
      expect(result.value).toBe(true);
      expect(result.reason).toEqual({ kind: "default" });
    });

    test("returns default when no userId in context", () => {
      const flag = makeFlag({
        key: "f1",
        type: "boolean",
        defaultValue: true,
        enabled: true,
        rollout: { percentage: 50 },
      });
      const result = evaluateFlag(flag, {});
      expect(result.value).toBe(true);
      expect(result.reason).toEqual({ kind: "default" });
    });

    test("uses first variant value for variant type in rollout", () => {
      const flag = makeFlag({
        key: "f1",
        type: "variant",
        defaultValue: "control",
        enabled: true,
        variants: [
          { key: "v1", value: "treatment" },
          { key: "v2", value: "control" },
        ],
        rollout: { percentage: 100 },
      });
      const result = evaluateFlag(flag, { userId: "u1" });
      expect(result.reason.kind).toBe("rollout");
      expect(result.value).toBe("treatment");
    });
  });

  describe("default", () => {
    test("returns defaultValue with reason default when no schedule or rollout", () => {
      const flag = makeFlag({
        key: "f1",
        type: "string",
        defaultValue: "hello",
        enabled: true,
      });
      const result = evaluateFlag(flag, {});
      expect(result.value).toBe("hello");
      expect(result.reason).toEqual({ kind: "default" });
    });

    test("returns defaultValue when enabled is undefined (treated as truthy)", () => {
      const flag = makeFlag({
        key: "f1",
        type: "number",
        defaultValue: 42,
      });
      const result = evaluateFlag(flag, {});
      expect(result.value).toBe(42);
      expect(result.reason).toEqual({ kind: "default" });
    });
  });
});
