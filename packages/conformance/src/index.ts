import { describe, expect, test } from "bun:test";
import { betterFlag } from "@better-flag/core";
import type { FlagAdapter } from "@better-flag/core";

export interface ConformanceOptions {
  adapter: FlagAdapter;
}

/**
 * Run conformance tests against a FlagAdapter implementation.
 */
export function runConformanceTests(options: ConformanceOptions): void {
  const { adapter } = options;

  const getEngine = () => betterFlag({ adapter });

  describe("FlagAdapter conformance", () => {
    test("get returns null for unknown key", async () => {
      const flag = await adapter.flags.get("unknown-flag-key");
      expect(flag).toBeNull();
    });

    test("set and get round-trip", async () => {
      const flag = {
        key: "test-flag",
        type: "boolean" as const,
        defaultValue: false,
        enabled: true,
      };
      await adapter.flags.set(flag);
      const got = await adapter.flags.get("test-flag");
      expect(got).not.toBeNull();
      expect(got?.key).toBe("test-flag");
      expect(got?.type).toBe("boolean");
      expect(got?.defaultValue).toBe(false);
    });

    test("getAll returns all flags", async () => {
      const unique = `a-${Date.now()}`;
      const unique2 = `b-${Date.now()}`;
      await adapter.flags.set({
        key: unique,
        type: "boolean",
        defaultValue: true,
      });
      await adapter.flags.set({
        key: unique2,
        type: "string",
        defaultValue: "default",
      });
      const all = await adapter.flags.getAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
      expect(all.some((f) => f.key === unique)).toBe(true);
      expect(all.some((f) => f.key === unique2)).toBe(true);
    });

    test("delete removes flag", async () => {
      await adapter.flags.set({
        key: "to-delete",
        type: "boolean",
        defaultValue: false,
      });
      await adapter.flags.delete("to-delete");
      const got = await adapter.flags.get("to-delete");
      expect(got).toBeNull();
    });
  });

  describe("FlagEngine evaluate", () => {
    test("evaluate returns default when enabled", async () => {
      const engine = getEngine();
      await adapter.flags.set({
        key: "simple",
        type: "boolean",
        defaultValue: true,
        enabled: true,
      });
      const result = await engine.evaluate("simple", {});
      expect(result.value).toBe(true);
      expect(result.reason.kind).toBe("default");
    });

    test("evaluate returns default when disabled", async () => {
      const engine = getEngine();
      await adapter.flags.set({
        key: "disabled",
        type: "boolean",
        defaultValue: true,
        enabled: false,
      });
      const result = await engine.evaluate("disabled", {});
      expect(result.value).toBe(true);
      expect(result.reason.kind).toBe("disabled");
    });
  });
}
