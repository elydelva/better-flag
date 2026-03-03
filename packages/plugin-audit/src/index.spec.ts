import { describe, expect, test } from "bun:test";
import { createAuditPlugin } from "./index.js";

describe("createAuditPlugin", () => {
  test("returns FlagPlugin with name and version", () => {
    const plugin = createAuditPlugin();
    expect(plugin.name).toBe("audit");
    expect(plugin.version).toBe("1.0.0");
  });

  test("includes schemaContribution with audit_log table", () => {
    const plugin = createAuditPlugin();
    expect(plugin.schemaContribution).toBeDefined();
    expect(plugin.schemaContribution?.tables).toHaveLength(1);
    expect(plugin.schemaContribution?.tables?.[0]?.name).toBe("audit_log");
    expect(plugin.schemaContribution?.tables?.[0]?.columns?.event).toBeDefined();
  });
});
