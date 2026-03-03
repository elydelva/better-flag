import { describe, expect, test } from "bun:test";
import { createInMemoryOverridesStore } from "./createInMemoryOverridesStore.js";

describe("createInMemoryOverridesStore", () => {
  test("get returns null when no override set", async () => {
    const store = createInMemoryOverridesStore();
    const value = await store.get("flag1", "user1");
    expect(value).toBeNull();
  });

  test("set and get round-trip", async () => {
    const store = createInMemoryOverridesStore();
    await store.set("flag1", "user1", true);
    const value = await store.get("flag1", "user1");
    expect(value).toBe(true);
  });

  test("delete removes override", async () => {
    const store = createInMemoryOverridesStore();
    await store.set("flag1", "user1", "x");
    await store.delete("flag1", "user1");
    const value = await store.get("flag1", "user1");
    expect(value).toBeNull();
  });

  test("list returns all overrides when no flagKey filter", async () => {
    const store = createInMemoryOverridesStore();
    await store.set("f1", "u1", true);
    await store.set("f2", "u1", "v");
    const list = await store.list();
    expect(list.length).toBe(2);
  });

  test("list filters by flagKey when provided", async () => {
    const store = createInMemoryOverridesStore();
    await store.set("f1", "u1", true);
    await store.set("f2", "u1", "v");
    const list = await store.list("f1");
    expect(list.length).toBe(1);
    expect(list[0]?.flagKey).toBe("f1");
  });
});
