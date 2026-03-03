import { describe, expect, test } from "bun:test";
import type { Flag } from "@better-flag/core";
import { createRedisFlagAdapter } from "./index.js";

/** In-memory mock of Bun RedisClient for unit tests. */
function createMockRedis(): {
  store: Map<string, string>;
  pubSub: Map<string, ((msg: string) => void)[]>;
  client: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    del: (key: string) => Promise<void>;
    send: (cmd: string, args: string[]) => Promise<string[]>;
    publish: (channel: string, msg: string) => Promise<void>;
    duplicate: () => Promise<{
      connect: () => Promise<void>;
      subscribe: (channel: string, cb: () => void) => void;
      unsubscribe: (channel: string) => void;
      close: () => void;
    }>;
    connect: () => Promise<void>;
  };
} {
  const store = new Map<string, string>();
  const pubSub = new Map<string, ((msg: string) => void)[]>();

  const client = {
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value);
    },
    del: async (key: string) => {
      store.delete(key);
    },
    send: async (cmd: string, args: string[]) => {
      if (cmd === "KEYS") {
        const pattern = args[0];
        const prefix = pattern.replace(/\*$/, "");
        return [...store.keys()].filter((k) => k.startsWith(prefix));
      }
      return [];
    },
    publish: async (channel: string, msg: string) => {
      const subs = pubSub.get(channel);
      if (subs) for (const cb of subs) cb(msg);
    },
    duplicate: async () => {
      const subClient = {
        connect: async () => {},
        subscribe: (channel: string, cb: () => void) => {
          const list = pubSub.get(channel) ?? [];
          list.push(() => cb());
          pubSub.set(channel, list);
        },
        unsubscribe: (channel: string) => {
          pubSub.delete(channel);
        },
        close: () => {},
      };
      return subClient;
    },
    connect: async () => {},
  };

  return { store, pubSub, client };
}

describe("createRedisFlagAdapter", () => {
  test("returns FlagAdapter with flags CRUD and extensions", () => {
    const { client } = createMockRedis();
    const adapter = createRedisFlagAdapter(client as never);
    expect(adapter.flags).toBeDefined();
    expect(typeof adapter.flags.get).toBe("function");
    expect(typeof adapter.flags.getAll).toBe("function");
    expect(typeof adapter.flags.set).toBe("function");
    expect(typeof adapter.flags.delete).toBe("function");
    expect(adapter.extensions).toBeDefined();
    expect(typeof adapter.subscribe).toBe("function");
    expect(typeof adapter.onReady).toBe("function");
  });

  test("flags.get returns null when key does not exist", async () => {
    const { client } = createMockRedis();
    const adapter = createRedisFlagAdapter(client as never);
    await adapter.onReady();
    const result = await adapter.flags.get("missing");
    expect(result).toBeNull();
  });

  test("flags.set and flags.get round-trip", async () => {
    const { client } = createMockRedis();
    const adapter = createRedisFlagAdapter(client as never);
    await adapter.onReady();

    const flag: Flag = {
      key: "feature-x",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    };
    await adapter.flags.set(flag);
    const got = await adapter.flags.get("feature-x");
    expect(got).toEqual(flag);
  });

  test("flags.getAll returns all flags with keyPrefix", async () => {
    const { client } = createMockRedis();
    const adapter = createRedisFlagAdapter(client as never, { keyPrefix: "bf:" });
    await adapter.onReady();

    await adapter.flags.set({
      key: "a",
      type: "boolean",
      defaultValue: false,
      enabled: true,
    });
    await adapter.flags.set({
      key: "b",
      type: "string",
      defaultValue: "hello",
      enabled: true,
    });

    const all = await adapter.flags.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((f) => f.key).sort()).toEqual(["a", "b"]);
  });

  test("flags.delete removes flag", async () => {
    const { client } = createMockRedis();
    const adapter = createRedisFlagAdapter(client as never);
    await adapter.onReady();

    await adapter.flags.set({
      key: "to-delete",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });
    expect(await adapter.flags.get("to-delete")).not.toBeNull();

    await adapter.flags.delete("to-delete");
    expect(await adapter.flags.get("to-delete")).toBeNull();
  });

  test("extensions.getPluginData and setPluginData round-trip", async () => {
    const { client } = createMockRedis();
    const adapter = createRedisFlagAdapter(client as never);
    await adapter.onReady();

    await adapter.extensions.setPluginData("rate-limit", "f1", { count: 5 });
    const data = await adapter.extensions.getPluginData("rate-limit", "f1");
    expect(data).toEqual({ count: 5 });
  });

  test("extensions.deletePluginData removes data", async () => {
    const { client } = createMockRedis();
    const adapter = createRedisFlagAdapter(client as never);
    await adapter.onReady();

    await adapter.extensions.setPluginData("audit", "f1", { lastEval: 123 });
    await adapter.extensions.deletePluginData("audit", "f1");
    expect(await adapter.extensions.getPluginData("audit", "f1")).toBeNull();
  });

  test("subscribe returns unsubscribe function", () => {
    const { client } = createMockRedis();
    const adapter = createRedisFlagAdapter(client as never);
    const unsub = adapter.subscribe(() => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });

  test("flags.get returns null when value is invalid JSON", async () => {
    const { client, store } = createMockRedis();
    store.set("bf:corrupted", "{invalid json");
    const adapter = createRedisFlagAdapter(client as never);
    await adapter.onReady();
    const result = await adapter.flags.get("corrupted");
    expect(result).toBeNull();
  });

  test("flags.getAll skips corrupted entries", async () => {
    const { client, store } = createMockRedis();
    store.set(
      "bf:a",
      JSON.stringify({ key: "a", type: "boolean", defaultValue: true, enabled: true })
    );
    store.set("bf:b", "not valid json");
    store.set(
      "bf:c",
      JSON.stringify({ key: "c", type: "string", defaultValue: "x", enabled: true })
    );
    const adapter = createRedisFlagAdapter(client as never);
    await adapter.onReady();
    const all = await adapter.flags.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((f) => f.key).sort()).toEqual(["a", "c"]);
  });

  test("subscribe callback is invoked when publish is triggered", async () => {
    const { client } = createMockRedis();
    const adapter = createRedisFlagAdapter(client as never);
    await adapter.onReady();
    let called = false;
    adapter.subscribe(() => {
      called = true;
    });
    await new Promise((r) => setTimeout(r, 20));
    await adapter.flags.set({
      key: "trigger",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(called).toBe(true);
  });
});
