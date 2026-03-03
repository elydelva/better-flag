import { describe, expect, test } from "bun:test";
import { createInMemoryFlagAdapter } from "@better-flag/adapter-memory";
import { betterFlag } from "@better-flag/core";
import { createOverridesPlugin } from "./index.js";

describe("createOverridesPlugin", () => {
  test("returns FlagPlugin with evaluator", () => {
    const plugin = createOverridesPlugin();
    expect(plugin.name).toBe("overrides");
    expect(plugin.evaluators).toBeDefined();
    expect(plugin.evaluators).toHaveLength(1);
    expect(plugin.evaluators?.[0]?.priority).toBe(1000);
  });

  test("evaluator returns override value when set", async () => {
    const adapter = createInMemoryFlagAdapter();
    await adapter.onReady();
    await adapter.flags.set({
      key: "f1",
      type: "boolean",
      defaultValue: false,
      enabled: true,
    });

    const store = (
      await import("./createInMemoryOverridesStore.js")
    ).createInMemoryOverridesStore();
    await store.set("f1", "user-1", true);

    const engine = betterFlag({
      adapter,
      plugins: [createOverridesPlugin({ store })],
    });

    const result = await engine.evaluate("f1", { userId: "user-1" });
    expect(result.value).toBe(true);
    expect(result.reason.kind).toBe("override");
  });

  test("evaluator returns null (falls through) when no override", async () => {
    const adapter = createInMemoryFlagAdapter();
    await adapter.onReady();
    await adapter.flags.set({
      key: "f1",
      type: "boolean",
      defaultValue: true,
      enabled: true,
    });

    const engine = betterFlag({
      adapter,
      plugins: [createOverridesPlugin()],
    });

    const result = await engine.evaluate("f1", { userId: "user-1" });
    expect(result.value).toBe(true);
    expect(result.reason.kind).toBe("default");
  });
});
