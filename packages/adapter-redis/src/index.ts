import type { Flag, FlagAdapter } from "@better-flag/core";
import { RedisClient } from "bun";

export interface RedisFlagAdapterOptions {
  keyPrefix?: string;
}

function parseFlag(data: string | null): Flag | null {
  if (data == null) return null;
  try {
    return JSON.parse(data) as Flag;
  } catch {
    return null;
  }
}

function fullKey(prefix: string, flagKey: string): string {
  return `${prefix}${flagKey}`;
}

/**
 * Redis flag adapter using Bun.redis. Stores flags as JSON at keyPrefix+flagKey.
 * Supports subscribe() via Redis pub/sub for change notifications.
 */
export function createRedisFlagAdapter(
  redisUrlOrClient: string | RedisClient,
  options: RedisFlagAdapterOptions = {}
): FlagAdapter {
  const keyPrefix = options.keyPrefix ?? "bf:";
  const pubChannel = `${keyPrefix}updates`;

  const redis =
    typeof redisUrlOrClient === "string" ? new RedisClient(redisUrlOrClient) : redisUrlOrClient;

  const extensionPrefix = `${keyPrefix}ext:`;

  function extKey(pluginKey: string, flagKey: string): string {
    return `${extensionPrefix}${pluginKey}:${flagKey}`;
  }

  return {
    flags: {
      get: async (key: string): Promise<Flag | null> => {
        const data = await redis.get(fullKey(keyPrefix, key));
        return parseFlag(data);
      },
      getAll: async (): Promise<Flag[]> => {
        const keys = (await redis.send("KEYS", [`${keyPrefix}*`])) as string[];
        const flagKeys = keys.filter((k) => !k.startsWith(extensionPrefix) && k !== pubChannel);
        const flags: Flag[] = [];
        for (const k of flagKeys) {
          const data = await redis.get(k);
          const flag = parseFlag(data);
          if (flag) flags.push(flag);
        }
        return flags;
      },
      set: async (flag: Flag): Promise<void> => {
        const k = fullKey(keyPrefix, flag.key);
        await redis.set(k, JSON.stringify(flag));
        redis.publish(pubChannel, "set");
      },
      delete: async (key: string): Promise<void> => {
        await redis.del(fullKey(keyPrefix, key));
        redis.publish(pubChannel, "delete");
      },
    },
    extensions: {
      getPluginData: (pluginKey: string, flagKey: string) =>
        redis.get(extKey(pluginKey, flagKey)).then((v) => (v ? JSON.parse(v) : null)),
      setPluginData: (pluginKey: string, flagKey: string, data: unknown) =>
        redis.set(extKey(pluginKey, flagKey), JSON.stringify(data)),
      deletePluginData: (pluginKey: string, flagKey: string) =>
        redis.del(extKey(pluginKey, flagKey)),
    },
    subscribe: (callback: () => void): (() => void) => {
      let subscriber: RedisClient | null = null;
      let unsubscribed = false;
      redis.duplicate().then((sub) => {
        if (unsubscribed) {
          sub.close();
          return;
        }
        subscriber = sub;
        sub.connect().then(() => {
          if (unsubscribed) return;
          sub.subscribe(pubChannel, () => callback());
        });
      });
      return () => {
        unsubscribed = true;
        if (subscriber) {
          subscriber.unsubscribe(pubChannel);
          subscriber.close();
          subscriber = null;
        }
      };
    },
    onReady: async () => {
      await redis.connect();
    },
  };
}
