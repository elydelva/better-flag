import { describe, expect, test } from "bun:test";
import { createInMemoryFlagAdapter } from "@better-flag/adapter-memory";
import { betterFlag, dispatch } from "./index.js";

describe("betterFlag + dispatch", () => {
  test("betterFlag returns FlagEngine", () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    expect(engine).toBeDefined();
    expect(engine.tablePrefix).toBe("bf_");
  });

  test("dispatch GET /flags returns 200 with flags array", async () => {
    const adapter = createInMemoryFlagAdapter();
    await adapter.flags.set({
      key: "f1",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });
    const engine = betterFlag({ adapter });
    const req = {
      method: "GET",
      path: "/flags",
      params: {},
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("dispatch returns 404 for unmatched route", async () => {
    const engine = betterFlag({ adapter: createInMemoryFlagAdapter() });
    const req = {
      method: "GET",
      path: "/nonexistent",
      params: {},
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req);
    expect(res.status).toBe(404);
    expect((res.body as { code?: string }).code).toBe("NOT_FOUND");
  });

  test("dispatch strips basePath before matching", async () => {
    const adapter = createInMemoryFlagAdapter();
    const engine = betterFlag({ adapter });
    const req = {
      method: "GET",
      path: "/api/flags",
      params: {},
      query: {},
      body: null,
    };
    const res = await dispatch(engine, req, "/api");
    expect(res.status).toBe(200);
  });
});
