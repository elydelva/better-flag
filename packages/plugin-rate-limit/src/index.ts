import type { FlagPlugin } from "@better-flag/core";
import { RateLimitService } from "./RateLimitService.js";
import type { RateLimitStore } from "./RateLimitStore.interface.js";
import { createInMemoryRateLimitStore } from "./createInMemoryRateLimitStore.js";

export { RateLimitService } from "./RateLimitService.js";
export { createInMemoryRateLimitStore } from "./createInMemoryRateLimitStore.js";
export type { RateLimitStore } from "./RateLimitStore.interface.js";

export interface RateLimitPluginOptions {
  store?: RateLimitStore;
  limit?: number;
  windowMs?: number;
}

/**
 * Rate-limit plugin for POST /flags/evaluate. Limits evaluate requests per client.
 */
export function createRateLimitPlugin(options: RateLimitPluginOptions = {}): FlagPlugin {
  const store = options.store ?? createInMemoryRateLimitStore();
  const limit = options.limit ?? 100;
  const windowMs = options.windowMs ?? 60_000;

  return {
    name: "rate-limit",
    version: "1.0.0",

    createServices: () => {
      const service = new RateLimitService({ store, limit, windowMs });
      return { rateLimit: service };
    },
  };
}
