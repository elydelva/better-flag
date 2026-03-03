import { describe, expect, test } from "bun:test";
import { createInMemoryRateLimitStore } from "./createInMemoryRateLimitStore.js";

describe("createInMemoryRateLimitStore", () => {
  test("check returns true when under limit", async () => {
    const store = createInMemoryRateLimitStore();
    const allowed = await store.check("key1", 5, 60_000);
    expect(allowed).toBe(true);
  });

  test("check returns false when at limit", async () => {
    const store = createInMemoryRateLimitStore();
    for (let i = 0; i < 5; i++) {
      await store.record("key1");
    }
    const allowed = await store.check("key1", 5, 60_000);
    expect(allowed).toBe(false);
  });

  test("record increments count", async () => {
    const store = createInMemoryRateLimitStore();
    await store.record("k");
    await store.record("k");
    const allowed = await store.check("k", 2, 60_000);
    expect(allowed).toBe(false);
  });

  test("different keys have independent buckets", async () => {
    const store = createInMemoryRateLimitStore();
    for (let i = 0; i < 3; i++) {
      await store.record("keyA");
    }
    const allowedB = await store.check("keyB", 2, 60_000);
    expect(allowedB).toBe(true);
  });
});
