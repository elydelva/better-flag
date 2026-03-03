import { describe, expect, test } from "bun:test";
import { createRulesPlugin } from "./index.js";

describe("createRulesPlugin", () => {
  test("returns FlagPlugin with name and version", () => {
    const plugin = createRulesPlugin();
    expect(plugin.name).toBe("rules");
    expect(plugin.version).toBe("1.0.0");
  });

  test("includes schemaContribution with rules table", () => {
    const plugin = createRulesPlugin();
    expect(plugin.schemaContribution).toBeDefined();
    expect(plugin.schemaContribution?.tables).toHaveLength(1);
    expect(plugin.schemaContribution?.tables?.[0]?.name).toBe("rules");
    expect(plugin.schemaContribution?.tables?.[0]?.columns?.flagKey).toBeDefined();
  });
});
