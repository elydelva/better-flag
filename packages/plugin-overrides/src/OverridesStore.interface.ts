import type { FlagValue } from "@better-flag/types";

export interface OverridesStore {
  get(flagKey: string, contextKey: string): Promise<FlagValue | null>;
  set(flagKey: string, contextKey: string, value: FlagValue): Promise<void>;
  delete(flagKey: string, contextKey: string): Promise<void>;
  list(flagKey?: string): Promise<Array<{ flagKey: string; contextKey: string; value: FlagValue }>>;
}
