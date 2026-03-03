import { describe, expect, test } from "bun:test";
import { createInMemoryFlagAdapter } from "@better-flag/adapter-memory";
import { betterFlag } from "@better-flag/core";
import { createNextHandler } from "./index.js";

function createMockNextRequest(
  overrides: {
    method?: string;
    url?: string;
    body?: string;
  } = {}
) {
  const url = overrides.url ?? "http://localhost/flags";
  return {
    method: overrides.method ?? "GET",
    url,
    nextUrl: new URL(url),
    text: async () => overrides.body ?? "",
  } as unknown as import("next/server").NextRequest;
}

describe("createNextHandler", () => {
  test("returns handler object with GET, POST, PATCH, DELETE", () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    const handler = createNextHandler(engine);
    expect(typeof handler.GET).toBe("function");
    expect(typeof handler.POST).toBe("function");
    expect(typeof handler.PATCH).toBe("function");
    expect(typeof handler.DELETE).toBe("function");
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
    const handler = createNextHandler(engine);
    const req = createMockNextRequest({ method: "GET", url: "http://localhost/flags" });
    const res = await handler.GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });

  test("strips basePath when provided", async () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    const handler = createNextHandler(engine, { basePath: "/api" });
    const req = createMockNextRequest({ method: "GET", url: "http://localhost/api/flags" });
    const res = await handler.GET(req);
    expect(res.status).toBe(200);
  });

  test("getContext passes auth to evaluate", async () => {
    const adapter = createInMemoryFlagAdapter();
    await adapter.flags.set({
      key: "eval-flag",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });
    const engine = betterFlag({ adapter });
    const handler = createNextHandler(engine, {
      getContext: () => ({ userId: "next-user" }),
    });
    const req = createMockNextRequest({
      method: "POST",
      url: "http://localhost/flags/evaluate",
      body: JSON.stringify({ key: "eval-flag", context: { userId: "next-user" } }),
    });
    const res = await handler.POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("value");
  });

  test("requireAuth returns 401 when getContext returns null", async () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    const handler = createNextHandler(engine, {
      getContext: () => null,
      requireAuth: true,
    });
    const req = createMockNextRequest({ method: "GET", url: "http://localhost/flags" });
    const res = await handler.GET(req);
    expect(res.status).toBe(401);
  });
});
