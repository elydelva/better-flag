import { describe, expect, test } from "bun:test";
import { FlagNotFoundError } from "@better-flag/errors";
import type { Flag } from "@better-flag/types";
import type { FlagAdapter } from "./adapter.js";
import { FlagEngine } from "./engine.js";

function createMockAdapter(overrides?: Partial<FlagAdapter>): FlagAdapter {
  const store = new Map<string, Flag>();
  return {
    flags: {
      get: async (key: string) => store.get(key) ?? null,
      getAll: async () => Array.from(store.values()),
      set: async (flag: Flag) => {
        store.set(flag.key, { ...flag });
      },
      delete: async (key: string) => {
        store.delete(key);
      },
    },
    onReady: async () => {},
    ...overrides,
  };
}

describe("FlagEngine", () => {
  test("uses bf_ as default tablePrefix", () => {
    const engine = new FlagEngine({ adapter: createMockAdapter() });
    expect(engine.tablePrefix).toBe("bf_");
  });

  test("uses custom tablePrefix when provided", () => {
    const engine = new FlagEngine({ adapter: createMockAdapter(), tablePrefix: "custom_" });
    expect(engine.tablePrefix).toBe("custom_");
  });

  test("evaluate throws FlagNotFoundError when flag does not exist", async () => {
    const engine = new FlagEngine({ adapter: createMockAdapter() });
    await expect(engine.evaluate("missing", {})).rejects.toThrow(FlagNotFoundError);
  });

  test("evaluate returns result when flag exists", async () => {
    const adapter = createMockAdapter();
    await adapter.flags.set({
      key: "f1",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });
    const engine = new FlagEngine({ adapter });
    const result = await engine.evaluate("f1", {});
    expect(result.value).toBe(true);
    expect(result.reason.kind).toBe("default");
  });

  test("evaluate uses evaluator when plugin provides one and it short-circuits", async () => {
    const adapter = createMockAdapter();
    await adapter.flags.set({
      key: "f1",
      type: "boolean",
      defaultValue: false,
      enabled: true,
    });
    const engine = new FlagEngine({
      adapter,
      plugins: [
        {
          name: "override",
          evaluators: [
            {
              priority: 100,
              evaluate: async () => ({ value: true, reason: { kind: "override" } }),
            },
          ],
        },
      ],
    });
    const result = await engine.evaluate("f1", { userId: "u1" });
    expect(result.value).toBe(true);
    expect(result.reason).toEqual({ kind: "override" });
  });

  test("returns getRoutes with correct structure", () => {
    const engine = new FlagEngine({ adapter: createMockAdapter() });
    const routes = engine.getRoutes();
    expect(routes.length).toBeGreaterThanOrEqual(6);
    const first = routes[0];
    expect(first).toHaveProperty("method");
    expect(first).toHaveProperty("path");
    expect(first).toHaveProperty("handler");
    expect(typeof first?.handler).toBe("function");
  });

  test("getPlugin returns plugin service when plugin provides createServices", () => {
    const engine = new FlagEngine({
      adapter: createMockAdapter(),
      plugins: [
        {
          name: "svc",
          createServices: () => ({ myService: { id: "svc-1" } }),
        },
      ],
    });
    const svc = engine.getPlugin<{ id: string }>("myService");
    expect(svc?.id).toBe("svc-1");
  });

  test("getPlugin returns undefined for unknown plugin", () => {
    const engine = new FlagEngine({ adapter: createMockAdapter() });
    expect(engine.getPlugin("unknown")).toBeUndefined();
  });

  test("getSchemaConfigForCLI returns schema from plugins with schemaContribution", () => {
    const engine = new FlagEngine({
      adapter: createMockAdapter(),
      plugins: [
        {
          name: "rules",
          schemaContribution: { tables: [{ name: "rules", columns: {} }] },
        },
      ],
    });
    const config = engine.getSchemaConfigForCLI();
    expect(config.tablePrefix).toBe("bf_");
    expect(config.contributors).toHaveLength(1);
    expect(config.contributors[0]?.schemaContribution?.tables).toHaveLength(1);
  });

  test("init calls adapter onReady and bootstrap when provided", async () => {
    let onReadyCalled = false;
    let bootstrapCalled = false;
    const adapter = createMockAdapter({
      onReady: async () => {
        onReadyCalled = true;
      },
    });
    const engine = new FlagEngine({
      adapter,
      bootstrap: async () => {
        bootstrapCalled = true;
      },
    });
    await engine.init();
    expect(onReadyCalled).toBe(true);
    expect(bootstrapCalled).toBe(true);
  });

  test("init is idempotent", async () => {
    let onReadyCalls = 0;
    const adapter = createMockAdapter({
      onReady: async () => {
        onReadyCalls++;
      },
    });
    const engine = new FlagEngine({ adapter });
    await engine.init();
    await engine.init();
    expect(onReadyCalls).toBe(1);
  });
});
