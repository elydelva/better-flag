import type { Flag, FlagAdapter } from "@better-flag/core";

function parseFlags(data: string): Flag[] {
  try {
    const parsed = JSON.parse(data) as unknown;
    return Array.isArray(parsed) ? (parsed as Flag[]) : [];
  } catch {
    return [];
  }
}

function serializeFlags(flags: Flag[]): string {
  return JSON.stringify(flags, null, 2);
}

/**
 * File-based flag adapter. Persists flags to a JSON file via Bun.file.
 * Use for simple single-process setups.
 */
export function createFileFlagAdapter(filePath: string): FlagAdapter {
  const file = Bun.file(filePath);
  let cache: Map<string, Flag> = new Map();

  async function load(): Promise<void> {
    const text = await file.text().catch(() => "[]");
    const flags = parseFlags(text);
    cache = new Map(flags.map((f) => [f.key, f]));
  }

  async function save(): Promise<void> {
    const flags = Array.from(cache.values());
    await Bun.write(filePath, serializeFlags(flags));
  }

  return {
    flags: {
      get: async (key: string): Promise<Flag | null> => {
        if (cache.size === 0) await load();
        return cache.get(key) ?? null;
      },
      getAll: async (): Promise<Flag[]> => {
        if (cache.size === 0) await load();
        return Array.from(cache.values());
      },
      set: async (flag: Flag): Promise<void> => {
        if (cache.size === 0) await load();
        cache.set(flag.key, { ...flag });
        await save();
      },
      delete: async (key: string): Promise<void> => {
        if (cache.size === 0) await load();
        cache.delete(key);
        await save();
      },
    },
    extensions: {},
    onReady: async () => {
      await load();
    },
  };
}
