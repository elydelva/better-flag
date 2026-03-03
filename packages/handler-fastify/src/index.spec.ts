import { describe, expect, test } from "bun:test";
import { createInMemoryFlagAdapter } from "@better-flag/adapter-memory";
import { betterFlag } from "@better-flag/core";
import { createFastifyHandler } from "./index.js";

describe("createFastifyHandler", () => {
  test("returns async plugin function", () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    const handler = createFastifyHandler(engine);
    expect(typeof handler).toBe("function");
  });

  test("plugin registers route handler", async () => {
    const adapter = createInMemoryFlagAdapter();
    await adapter.flags.set({
      key: "f1",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });
    const engine = betterFlag({ adapter });
    const plugin = createFastifyHandler(engine);
    const fastify = await import("fastify").then((m) => m.default());
    await fastify.register(plugin, { prefix: "" });
    const res = await fastify.inject({ method: "GET", path: "/flags" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(Array.isArray(body)).toBe(true);
    await fastify.close();
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
    const plugin = createFastifyHandler(engine, {
      getContext: () => ({ userId: "fastify-user" }),
    });
    const fastify = await import("fastify").then((m) => m.default());
    await fastify.register(plugin, { prefix: "" });
    const res = await fastify.inject({
      method: "POST",
      path: "/flags/evaluate",
      payload: { key: "eval-flag", context: { userId: "fastify-user" } },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty("value");
    await fastify.close();
  });

  test("requireAuth returns 401 when getContext returns null", async () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    const plugin = createFastifyHandler(engine, {
      getContext: () => null,
      requireAuth: true,
    });
    const fastify = await import("fastify").then((m) => m.default());
    await fastify.register(plugin, { prefix: "" });
    const res = await fastify.inject({ method: "GET", path: "/flags" });
    expect(res.statusCode).toBe(401);
    await fastify.close();
  });
});
