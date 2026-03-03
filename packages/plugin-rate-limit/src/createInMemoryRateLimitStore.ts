import type { RateLimitStore } from "./RateLimitStore.interface.js";

interface Bucket {
  count: number;
  windowStart: number;
}

export function createInMemoryRateLimitStore(): RateLimitStore {
  const buckets = new Map<string, Bucket>();

  return {
    async check(key: string, limit: number, windowMs: number): Promise<boolean> {
      const now = Date.now();
      let bucket = buckets.get(key);
      if (!bucket || now - bucket.windowStart >= windowMs) {
        bucket = { count: 0, windowStart: now };
        buckets.set(key, bucket);
      }
      return bucket.count < limit;
    },

    async record(key: string): Promise<void> {
      const now = Date.now();
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { count: 0, windowStart: now };
        buckets.set(key, bucket);
      }
      bucket.count++;
    },
  };
}
