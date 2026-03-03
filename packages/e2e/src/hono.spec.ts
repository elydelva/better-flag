import { describe, expect, test } from "bun:test";
import { createInMemoryFlagAdapter } from "@better-flag/adapter-memory";
import { betterFlag } from "@better-flag/core";
import { createHonoHandler } from "@better-flag/handler-hono";
import { Hono } from "hono";

function createApp() {
  const adapter = createInMemoryFlagAdapter();
  const engine = betterFlag({ adapter });
  const handler = createHonoHandler(engine, {
    basePath: "/api",
    getContext: () => ({ userId: "e2e-user" }),
  });
  const app = new Hono();
  app.all("/api/*", handler);
  return { app, adapter };
}

async function fetchJson(
  app: { fetch: (req: Request) => Response | Promise<Response> },
  url: string,
  init?: RequestInit
) {
  const base = "http://localhost";
  const res = await Promise.resolve(app.fetch(new Request(base + url, init)));
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { status: res.status, body };
}

describe("E2E Hono", () => {
  test("GET /api/flags returns empty array when no flags", async () => {
    const { app } = createApp();
    const { status, body } = await fetchJson(app, "/api/flags");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  test("POST /api/flags creates flag, GET returns it", async () => {
    const { app } = createApp();
    const created = await fetchJson(app, "/api/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "feature-x", type: "boolean", defaultValue: true }),
    });
    expect(created.status).toBe(201);
    expect(created.body.key).toBe("feature-x");

    const list = await fetchJson(app, "/api/flags");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].key).toBe("feature-x");

    const get = await fetchJson(app, "/api/flags/feature-x");
    expect(get.status).toBe(200);
    expect(get.body.key).toBe("feature-x");
  });

  test("POST /api/flags/evaluate returns evaluation result", async () => {
    const { app } = createApp();
    await fetchJson(app, "/api/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "eval-flag", type: "boolean", defaultValue: true }),
    });

    const res = await fetchJson(app, "/api/flags/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "eval-flag", context: { userId: "u1" } }),
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("value");
    expect(res.body).toHaveProperty("reason");
  });

  test("GET /api/flags/:key returns 404 for missing flag", async () => {
    const { app } = createApp();
    const res = await fetchJson(app, "/api/flags/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("FLAG_NOT_FOUND");
  });
});
