import type { FlagValue } from "@better-flag/types";
import type { OverridesStore } from "./OverridesStore.interface.js";

export function createInMemoryOverridesStore(): OverridesStore {
  const store = new Map<string, FlagValue>();

  function key(flagKey: string, contextKey: string): string {
    return `${flagKey}:${contextKey}`;
  }

  return {
    async get(flagKey: string, contextKey: string): Promise<FlagValue | null> {
      return store.get(key(flagKey, contextKey)) ?? null;
    },
    async set(flagKey: string, contextKey: string, value: FlagValue): Promise<void> {
      store.set(key(flagKey, contextKey), value);
    },
    async delete(flagKey: string, contextKey: string): Promise<void> {
      store.delete(key(flagKey, contextKey));
    },
    async list(
      flagKey?: string
    ): Promise<Array<{ flagKey: string; contextKey: string; value: FlagValue }>> {
      const out: Array<{ flagKey: string; contextKey: string; value: FlagValue }> = [];
      for (const [k, v] of store) {
        const parts = k.split(":");
        const fk = parts[0] ?? "";
        const ck = parts[1] ?? "";
        if (flagKey == null || fk === flagKey) {
          out.push({ flagKey: fk, contextKey: ck, value: v });
        }
      }
      return out;
    },
  };
}
