import { describe, expect, test } from "bun:test";
import { drizzleAdapter } from "./index.js";
import { buildFlagsSchema } from "./schema.js";

describe("drizzleAdapter", () => {
  test("returns FlagAdapter with flags CRUD", () => {
    const db = {} as never;
    const adapter = drizzleAdapter(db, {
      provider: "sqlite",
      tablePrefix: "bf_",
    });
    expect(adapter.flags).toBeDefined();
    expect(typeof adapter.flags.get).toBe("function");
    expect(typeof adapter.flags.getAll).toBe("function");
    expect(typeof adapter.flags.set).toBe("function");
    expect(typeof adapter.flags.delete).toBe("function");
    expect(typeof adapter.onReady).toBe("function");
  });
});

describe("buildFlagsSchema", () => {
  test("returns schema with flags table", () => {
    const schema = buildFlagsSchema([], { provider: "sqlite", tablePrefix: "bf_" });
    expect(schema.bf_flags).toBeDefined();
  });

  test("uses custom tablePrefix", () => {
    const schema = buildFlagsSchema([], { provider: "pg", tablePrefix: "custom_" });
    expect(schema.custom_flags).toBeDefined();
  });
});
