import type { Flag } from "@better-flag/types";

/** Flags CRUD interface */
export interface FlagAdapterFlags {
  get(key: string): Promise<Flag | null>;
  getAll(): Promise<Flag[]>;
  set(flag: Flag): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Adapter interface for flag storage. Implement for your database. */
export interface FlagAdapter {
  flags: FlagAdapterFlags;
  /** Optional extensions (e.g. for custom storage behavior) */
  extensions?: Record<string, unknown>;
  /** Optional subscription for flag changes (returns unsubscribe) */
  subscribe?(callback: () => void): (() => void) | undefined;
  onReady(): Promise<void>;
}
