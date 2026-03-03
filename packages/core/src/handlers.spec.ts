import { describe, expect, test } from "bun:test";
import { FlagNotFoundError, FlagValidationError } from "@better-flag/errors";
import type { Flag } from "@better-flag/types";
import type { FlagAdapter } from "./adapter.js";
import { FlagEngine } from "./engine.js";
import {
  handleFlagsCreate,
  handleFlagsDelete,
  handleFlagsEvaluate,
  handleFlagsGet,
  handleFlagsList,
  handleFlagsUpdate,
} from "./handlers.js";

function createMockAdapter(): FlagAdapter {
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
  };
}

function createEngine(adapter?: FlagAdapter): FlagEngine {
  return new FlagEngine({ adapter: adapter ?? createMockAdapter() });
}

function createReq(
  overrides: Partial<{
    method: string;
    path: string;
    params: Record<string, string>;
    query: Record<string, string>;
    body: unknown;
    auth: unknown;
  }> = {}
) {
  return {
    method: "GET",
    path: "/flags",
    params: {},
    query: {},
    body: null,
    auth: undefined,
    ...overrides,
  };
}

describe("handleFlagsList", () => {
  test("returns 200 with flags array", async () => {
    const adapter = createMockAdapter();
    await adapter.flags.set({
      key: "f1",
      type: "boolean",
      defaultValue: false,
      enabled: true,
    });
    const engine = createEngine(adapter);
    const res = await handleFlagsList({ engine, req: createReq() });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect((res.body as Flag[]).length).toBeGreaterThanOrEqual(1);
  });

  test("respects limit from query", async () => {
    const adapter = createMockAdapter();
    for (let i = 0; i < 5; i++) {
      await adapter.flags.set({
        key: `f${i}`,
        type: "boolean",
        defaultValue: false,
        enabled: true,
      });
    }
    const engine = createEngine(adapter);
    const res = await handleFlagsList({ engine, req: createReq({ query: { limit: "2" } }) });
    expect(res.status).toBe(200);
    expect((res.body as Flag[]).length).toBe(2);
  });
});

describe("handleFlagsGet", () => {
  test("returns 200 with flag when flag exists", async () => {
    const adapter = createMockAdapter();
    await adapter.flags.set({
      key: "my-flag",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });
    const engine = createEngine(adapter);
    const res = await handleFlagsGet({
      engine,
      req: createReq({ params: { key: "my-flag" } }),
    });
    expect(res.status).toBe(200);
    expect((res.body as Flag).key).toBe("my-flag");
  });

  test("throws FlagNotFoundError when flag does not exist", async () => {
    const engine = createEngine();
    await expect(
      handleFlagsGet({ engine, req: createReq({ params: { key: "missing" } }) })
    ).rejects.toThrow(FlagNotFoundError);
  });

  test("throws FlagValidationError when key is missing", async () => {
    const engine = createEngine();
    await expect(handleFlagsGet({ engine, req: createReq({ params: {} }) })).rejects.toThrow(
      FlagValidationError
    );
  });
});

describe("handleFlagsCreate", () => {
  test("returns 201 with created flag", async () => {
    const engine = createEngine();
    const res = await handleFlagsCreate({
      engine,
      req: createReq({
        method: "POST",
        body: {
          key: "new-flag",
          type: "boolean",
          defaultValue: false,
        },
      }),
    });
    expect(res.status).toBe(201);
    expect((res.body as Flag).key).toBe("new-flag");
    expect((res.body as Flag).type).toBe("boolean");
  });

  test("persists flag to adapter", async () => {
    const adapter = createMockAdapter();
    const engine = createEngine(adapter);
    await handleFlagsCreate({
      engine,
      req: createReq({
        method: "POST",
        body: { key: "persisted", type: "string", defaultValue: "x" },
      }),
    });
    const flag = await adapter.flags.get("persisted");
    expect(flag).not.toBeNull();
    expect(flag?.key).toBe("persisted");
  });
});

describe("handleFlagsUpdate", () => {
  test("returns 200 with updated flag", async () => {
    const adapter = createMockAdapter();
    await adapter.flags.set({
      key: "f1",
      type: "boolean",
      defaultValue: false,
      enabled: true,
    });
    const engine = createEngine(adapter);
    const res = await handleFlagsUpdate({
      engine,
      req: createReq({
        method: "PATCH",
        params: { key: "f1" },
        body: { enabled: false },
      }),
    });
    expect(res.status).toBe(200);
    expect((res.body as Flag).enabled).toBe(false);
  });

  test("throws FlagNotFoundError when flag does not exist", async () => {
    const engine = createEngine();
    await expect(
      handleFlagsUpdate({
        engine,
        req: createReq({ method: "PATCH", params: { key: "missing" }, body: {} }),
      })
    ).rejects.toThrow(FlagNotFoundError);
  });
});

describe("handleFlagsDelete", () => {
  test("returns 200 with deleted true", async () => {
    const adapter = createMockAdapter();
    await adapter.flags.set({
      key: "to-delete",
      type: "boolean",
      defaultValue: false,
      enabled: true,
    });
    const engine = createEngine(adapter);
    const res = await handleFlagsDelete({
      engine,
      req: createReq({ method: "DELETE", params: { key: "to-delete" } }),
    });
    expect(res.status).toBe(200);
    expect((res.body as { deleted: boolean }).deleted).toBe(true);
  });

  test("removes flag from adapter", async () => {
    const adapter = createMockAdapter();
    await adapter.flags.set({
      key: "gone",
      type: "boolean",
      defaultValue: false,
      enabled: true,
    });
    const engine = createEngine(adapter);
    await handleFlagsDelete({
      engine,
      req: createReq({ method: "DELETE", params: { key: "gone" } }),
    });
    const flag = await adapter.flags.get("gone");
    expect(flag).toBeNull();
  });

  test("throws FlagNotFoundError when flag does not exist", async () => {
    const engine = createEngine();
    await expect(
      handleFlagsDelete({ engine, req: createReq({ params: { key: "missing" } }) })
    ).rejects.toThrow(FlagNotFoundError);
  });
});

describe("handleFlagsEvaluate", () => {
  test("returns 200 with evaluation result when flag exists", async () => {
    const adapter = createMockAdapter();
    await adapter.flags.set({
      key: "eval-flag",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });
    const engine = createEngine(adapter);
    const res = await handleFlagsEvaluate({
      engine,
      req: createReq({
        method: "POST",
        body: { key: "eval-flag", context: { userId: "u1" } },
      }),
    });
    expect(res.status).toBe(200);
    expect((res.body as { value: string }).value).toBe(true);
    expect((res.body as { reason: { kind: string } }).reason).toHaveProperty("kind");
  });

  test("throws FlagValidationError when body is invalid", async () => {
    const engine = createEngine();
    await expect(
      handleFlagsEvaluate({
        engine,
        req: createReq({ method: "POST", body: { key: "" } }),
      })
    ).rejects.toThrow(FlagValidationError);
  });

  test("throws FlagNotFoundError when flag does not exist", async () => {
    const engine = createEngine();
    await expect(
      handleFlagsEvaluate({
        engine,
        req: createReq({ method: "POST", body: { key: "missing" } }),
      })
    ).rejects.toThrow(FlagNotFoundError);
  });

  test("merges req.auth with body context for evaluation", async () => {
    const adapter = createMockAdapter();
    await adapter.flags.set({
      key: "auth-flag",
      type: "boolean",
      defaultValue: true,
      enabled: true,
      rollout: { percentage: 100, seed: "s" },
    });
    const engine = createEngine(adapter);
    const res = await handleFlagsEvaluate({
      engine,
      req: createReq({
        method: "POST",
        body: { key: "auth-flag", context: { attributes: { plan: "pro" } } },
        auth: { userId: "auth-user", attributes: { role: "admin" } },
      }),
    });
    expect(res.status).toBe(200);
    expect((res.body as { value: boolean }).value).toBe(true);
  });
});
