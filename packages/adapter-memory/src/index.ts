import type { FlagAdapter } from "@better-flag/core";
import type { Flag } from "@better-flag/types";

/**
 * In-memory flag adapter. Volatile — data is lost when process exits.
 * Each call creates an independent store. Zero deps. Use for tests or development.
 */
export function createInMemoryFlagAdapter(): FlagAdapter {
  const store = new Map<string, Flag>();
  return {
    flags: {
      get: async (key: string): Promise<Flag | null> => store.get(key) ?? null,
      getAll: async (): Promise<Flag[]> => Array.from(store.values()),
      set: async (flag: Flag): Promise<void> => {
        store.set(flag.key, { ...flag });
      },
      delete: async (key: string): Promise<void> => {
        store.delete(key);
      },
    },
    extensions: {},
    onReady: async () => {},
  };
}
