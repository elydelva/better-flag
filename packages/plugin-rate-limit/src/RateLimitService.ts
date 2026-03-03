import { FlagRateLimitError } from "@better-flag/errors";
import type { RateLimitStore } from "./RateLimitStore.interface.js";

export interface RateLimitServiceConfig {
  store: RateLimitStore;
  /** Max evaluate requests per window (default 100) */
  limit?: number;
  /** Window in milliseconds (default 60_000) */
  windowMs?: number;
}

export class RateLimitService {
  constructor(private readonly config: RateLimitServiceConfig) {
    this.limit = config.limit ?? 100;
    this.windowMs = config.windowMs ?? 60_000;
  }

  private readonly limit: number;
  private readonly windowMs: number;

  /**
   * Checks if the client is under the rate limit for evaluate,
   * then records the request. Throws FlagRateLimitError if over limit.
   */
  async checkAndRecord(clientKey: string): Promise<void> {
    const allowed = await this.config.store.check(clientKey, this.limit, this.windowMs);
    if (!allowed) {
      throw new FlagRateLimitError(Math.ceil(this.windowMs / 1000));
    }
    await this.config.store.record(clientKey);
  }
}
