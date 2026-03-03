export interface RateLimitStore {
  check(key: string, limit: number, windowMs: number): Promise<boolean>;
  record(key: string): Promise<void>;
}
