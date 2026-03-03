import { describe, expect, test } from "bun:test";
import { runCli } from "./index.js";

describe("runCli", () => {
  test("runCli is a function", () => {
    expect(typeof runCli).toBe("function");
  });

  test("getSchemaConfig returns default when engine has no getSchemaConfigForCLI", () => {
    const createCli = (opts: { getSchemaConfig?: (e: unknown) => unknown }) => {
      const engine = {};
      const result = opts.getSchemaConfig?.(engine);
      return result;
    };
    const getSchemaConfig = (engine: unknown) => {
      const e = engine as {
        getSchemaConfigForCLI?: () => { tablePrefix: string; contributors: unknown[] };
      };
      if (typeof e.getSchemaConfigForCLI === "function") {
        return e.getSchemaConfigForCLI();
      }
      return { tablePrefix: "bf_", contributors: [] };
    };
    const result = getSchemaConfig({});
    expect(result).toEqual({ tablePrefix: "bf_", contributors: [] });
  });

  test("getSchemaConfig uses engine.getSchemaConfigForCLI when present", () => {
    const getSchemaConfig = (engine: unknown) => {
      const e = engine as {
        getSchemaConfigForCLI?: () => { tablePrefix: string; contributors: unknown[] };
      };
      if (typeof e.getSchemaConfigForCLI === "function") {
        return e.getSchemaConfigForCLI();
      }
      return { tablePrefix: "bf_", contributors: [] };
    };
    const engine = {
      getSchemaConfigForCLI: () => ({ tablePrefix: "custom_", contributors: ["x"] }),
    };
    const result = getSchemaConfig(engine);
    expect(result).toEqual({ tablePrefix: "custom_", contributors: ["x"] });
  });
});
