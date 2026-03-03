import { describe, expect, test } from "bun:test";
import { createInMemoryFlagAdapter } from "./index.js";

describe("createInMemoryFlagAdapter", () => {
  test("get returns null for unknown key", async () => {
    const adapter = createInMemoryFlagAdapter();
    const flag = await adapter.flags.get("unknown");
    expect(flag).toBeNull();
  });

  test("set and get round-trip", async () => {
    const adapter = createInMemoryFlagAdapter();
    const flag = {
      key: "test",
      type: "boolean" as const,
      defaultValue: true,
      enabled: true,
    };
    await adapter.flags.set(flag);
    const got = await adapter.flags.get("test");
    expect(got).not.toBeNull();
    expect(got?.key).toBe("test");
    expect(got?.defaultValue).toBe(true);
  });

  test("getAll returns all flags", async () => {
    const adapter = createInMemoryFlagAdapter();
    await adapter.flags.set({
      key: "a",
      type: "boolean",
      defaultValue: false,
    });
    await adapter.flags.set({
      key: "b",
      type: "string",
      defaultValue: "x",
    });
    const all = await adapter.flags.getAll();
    expect(all.length).toBe(2);
    expect(all.map((f) => f.key).sort()).toEqual(["a", "b"]);
  });

  test("delete removes flag", async () => {
    const adapter = createInMemoryFlagAdapter();
    await adapter.flags.set({
      key: "to-delete",
      type: "boolean",
      defaultValue: false,
    });
    await adapter.flags.delete("to-delete");
    const got = await adapter.flags.get("to-delete");
    expect(got).toBeNull();
  });

  test("onReady resolves", async () => {
    const adapter = createInMemoryFlagAdapter();
    await expect(adapter.onReady()).resolves.toBeUndefined();
  });
});
