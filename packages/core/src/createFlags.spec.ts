import { describe, expect, test } from "bun:test";
import { createFlags } from "./createFlags.js";

describe("createFlags", () => {
  test("maps definitions to Flag array with key from object key", () => {
    const defs = {
      "my-flag": { type: "boolean" as const, defaultValue: false },
    };
    const flags = createFlags(defs);
    expect(flags).toHaveLength(1);
    expect(flags[0]?.key).toBe("my-flag");
    expect(flags[0]?.type).toBe("boolean");
    expect(flags[0]?.defaultValue).toBe(false);
  });

  test("preserves variants when provided", () => {
    const defs = {
      "variant-flag": {
        type: "variant" as const,
        defaultValue: "control",
        variants: [
          { key: "a", value: "control" },
          { key: "b", value: "treatment" },
        ],
      },
    };
    const flags = createFlags(defs);
    expect(flags[0]?.variants).toHaveLength(2);
    expect(flags[0]?.variants?.[0]).toEqual({ key: "a", value: "control" });
  });

  test("preserves enabled, description, metadata", () => {
    const defs = {
      f: {
        type: "boolean" as const,
        defaultValue: true,
        enabled: false,
        description: "A flag",
        metadata: { foo: "bar" },
      },
    };
    const flags = createFlags(defs);
    expect(flags[0]?.enabled).toBe(false);
    expect(flags[0]?.description).toBe("A flag");
    expect(flags[0]?.metadata).toEqual({ foo: "bar" });
  });

  test("returns empty array for empty definitions", () => {
    const flags = createFlags({});
    expect(flags).toEqual([]);
  });

  test("handles multiple flags", () => {
    const defs = {
      a: { type: "boolean" as const, defaultValue: false },
      b: { type: "string" as const, defaultValue: "x" },
      c: { type: "number" as const, defaultValue: 0 },
    };
    const flags = createFlags(defs);
    expect(flags).toHaveLength(3);
    expect(flags.map((f) => f.key)).toEqual(["a", "b", "c"]);
  });
});
