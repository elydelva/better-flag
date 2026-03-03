import { describe, expect, test } from "bun:test";
import { createInMemoryFlagAdapter } from "@better-flag/adapter-memory";
import { betterFlag } from "@better-flag/core";
import { createHonoHandler } from "./index.js";

function createMockContext(
  overrides: {
    method?: string;
    path?: string;
    query?: Record<string, string>;
    bodyText?: string;
  } = {}
) {
  const method = overrides.method ?? "GET";
  const path = overrides.path ?? "/flags";
  const query = overrides.query ?? {};
  const bodyText = overrides.bodyText ?? "";

  let textConsumed = false;
  const req = {
    method,
    path,
    url: `http://localhost${path}`,
    query: () => query,
    text: async () => {
      if (textConsumed) throw new Error("Body already consumed");
      textConsumed = true;
      return bodyText;
    },
  };

  return {
    req,
    json: (body: unknown, status = 200) =>
      new Response(JSON.stringify(body ?? null), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    body: (_body: BodyInit | null, status: number) => new Response(null, { status }),
  };
}

describe("createHonoHandler", () => {
  test("returns handler function", () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    const handler = createHonoHandler(engine);
    expect(typeof handler).toBe("function");
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
    const handler = createHonoHandler(engine);
    const c = createMockContext({ method: "GET", path: "/flags" });
    const res = await handler(c as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });

  test("strips basePath when provided", async () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    const handler = createHonoHandler(engine, { basePath: "/api" });
    const c = createMockContext({ method: "GET", path: "/api/flags" });
    const res = await handler(c as never);
    expect(res.status).toBe(200);
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
    const handler = createHonoHandler(engine, {
      getContext: () => ({ userId: "u1" }),
    });
    const c = createMockContext({
      method: "POST",
      path: "/flags/evaluate",
      bodyText: JSON.stringify({ key: "eval-flag", context: { userId: "u1" } }),
    });
    const res = await handler(c as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("value");
    expect(json).toHaveProperty("reason");
  });
});
