import { describe, expect, test } from "bun:test";
import { createInMemoryFlagAdapter } from "@better-flag/adapter-memory";
import { betterFlag } from "@better-flag/core";
import { createExpressHandler } from "./index.js";

function createMockReq(
  overrides: {
    method?: string;
    path?: string;
    query?: Record<string, string>;
    body?: unknown;
  } = {}
) {
  return {
    method: overrides.method ?? "GET",
    path: overrides.path ?? "/flags",
    query: overrides.query ?? {},
    body: overrides.body,
    baseUrl: "",
    originalUrl: "",
    params: {},
    headers: {},
    get: () => undefined,
  };
}

function createMockRes() {
  const res: {
    statusCode: number;
    body: unknown;
    status: (code: number) => typeof res;
    json: (b: unknown) => void;
    sendStatus: (code: number) => void;
  } = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(b: unknown) {
      res.body = b;
    },
    sendStatus(code: number) {
      res.statusCode = code;
      res.body = undefined;
    },
  };
  return res;
}

describe("createExpressHandler", () => {
  test("returns RequestHandler function", () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    const handler = createExpressHandler(engine);
    expect(typeof handler).toBe("function");
    expect(handler.length).toBeGreaterThanOrEqual(2);
  });

  test("GET /flags returns 200 with flags array", async () => {
    const adapter = createInMemoryFlagAdapter();
    await adapter.flags.set({
      key: "f1",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });
    const engine = betterFlag({ adapter });
    const handler = createExpressHandler(engine);
    const req = createMockReq({ method: "GET", path: "/flags" });
    const res = createMockRes();
    await handler(req as never, res as never);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("strips basePath when provided", async () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    const handler = createExpressHandler(engine, { basePath: "/api" });
    const req = createMockReq({ method: "GET", path: "/api/flags" });
    const res = createMockRes();
    await handler(req as never, res as never);
    expect(res.statusCode).toBe(200);
  });

  test("POST /flags/evaluate returns evaluation result", async () => {
    const adapter = createInMemoryFlagAdapter();
    await adapter.flags.set({
      key: "eval-flag",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });
    const engine = betterFlag({ adapter });
    const handler = createExpressHandler(engine, {
      getContext: () => ({ userId: "u1" }),
    });
    const req = createMockReq({
      method: "POST",
      path: "/flags/evaluate",
      body: { key: "eval-flag", context: { userId: "u1" } },
    });
    const res = createMockRes();
    await handler(req as never, res as never);
    expect(res.statusCode).toBe(200);
    expect((res.body as { value?: unknown }).value).toBeDefined();
    expect((res.body as { reason?: unknown }).reason).toBeDefined();
  });
});
