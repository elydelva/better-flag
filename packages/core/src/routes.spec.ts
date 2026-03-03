import { describe, expect, test } from "bun:test";
import { buildRoutes } from "./routes.js";

describe("buildRoutes", () => {
  test("returns core routes when no plugins", () => {
    const routes = buildRoutes();
    expect(routes.length).toBeGreaterThanOrEqual(6);
    const paths = routes.map((r) => r.path);
    expect(paths).toContain("/flags");
    expect(paths).toContain("/flags/evaluate");
    expect(paths).toContain("/flags/:key");
  });

  test("includes plugin routes when plugins have routes", () => {
    const pluginWithRoute = {
      name: "test",
      routes: [
        { method: "GET", path: "/custom", handler: async () => ({ status: 200, body: {} }) },
      ],
    };
    const routes = buildRoutes([pluginWithRoute]);
    const custom = routes.find((r) => r.path === "/custom");
    expect(custom).toBeDefined();
    expect(custom?.method).toBe("GET");
  });

  test("core routes come before plugin routes", () => {
    const pluginWithRoute = {
      name: "test",
      routes: [
        { method: "GET", path: "/plugin", handler: async () => ({ status: 200, body: {} }) },
      ],
    };
    const routes = buildRoutes([pluginWithRoute]);
    const flagsIdx = routes.findIndex((r) => r.path === "/flags");
    const pluginIdx = routes.findIndex((r) => r.path === "/plugin");
    expect(flagsIdx).toBeLessThan(pluginIdx);
  });

  test("handles plugins with no routes", () => {
    const pluginNoRoutes = { name: "audit" };
    const routes = buildRoutes([pluginNoRoutes]);
    expect(routes.length).toBe(6);
  });
});
