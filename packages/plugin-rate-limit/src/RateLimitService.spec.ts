import { describe, expect, test } from "bun:test";
import { FlagRateLimitError } from "@better-flag/errors";
import { RateLimitService } from "./RateLimitService.js";
import { createInMemoryRateLimitStore } from "./createInMemoryRateLimitStore.js";

describe("RateLimitService", () => {
  test("checkAndRecord succeeds when under limit", async () => {
    const store = createInMemoryRateLimitStore();
    const service = new RateLimitService({ store, limit: 5, windowMs: 60_000 });
    await expect(service.checkAndRecord("client1")).resolves.toBeUndefined();
  });

  test("checkAndRecord throws FlagRateLimitError when over limit", async () => {
    const store = createInMemoryRateLimitStore();
    const service = new RateLimitService({ store, limit: 2, windowMs: 60_000 });
    await service.checkAndRecord("client1");
    await service.checkAndRecord("client1");
    await expect(service.checkAndRecord("client1")).rejects.toThrow(FlagRateLimitError);
  });

  test("FlagRateLimitError includes retryAfter when over limit", async () => {
    const store = createInMemoryRateLimitStore();
    const service = new RateLimitService({ store, limit: 1, windowMs: 120_000 });
    await service.checkAndRecord("c1");
    try {
      await service.checkAndRecord("c1");
    } catch (err) {
      expect(err).toBeInstanceOf(FlagRateLimitError);
      expect((err as FlagRateLimitError).retryAfter).toBe(120);
    }
  });
});
