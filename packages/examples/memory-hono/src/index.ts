import { createInMemoryFlagAdapter } from "@better-flag/adapter-memory";
import { betterFlag } from "@better-flag/core";
import { createHonoHandler } from "@better-flag/handler-hono";
import { createRateLimitPlugin } from "@better-flag/plugin-rate-limit";
import { Hono } from "hono";

const adapter = createInMemoryFlagAdapter();

// Bootstrap a sample flag
await adapter.onReady();
await adapter.flags.set({
  key: "new-dashboard",
  type: "boolean",
  defaultValue: false,
  enabled: true,
});

const engine = betterFlag({
  adapter,
  plugins: [createRateLimitPlugin({ limit: 100, windowMs: 60_000 })],
});

const handler = createHonoHandler(engine, {
  basePath: "/api",
  getContext: () => ({ userId: "demo-user" }),
});

const app = new Hono();
app.all("/api/*", handler);

const server = Bun.serve({
  port: 3000,
  fetch: app.fetch,
});

console.log(`better-flags example running at http://localhost:${server.port}`);
console.log("  GET  /api/flags");
console.log("  POST /api/flags/evaluate (body: { key, context? })");
