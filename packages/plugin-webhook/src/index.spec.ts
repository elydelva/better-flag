import { describe, expect, test } from "bun:test";
import { createWebhookPlugin } from "./index.js";

describe("createWebhookPlugin", () => {
  test("returns FlagPlugin with name and version", () => {
    const plugin = createWebhookPlugin();
    expect(plugin.name).toBe("webhook");
    expect(plugin.version).toBe("1.0.0");
  });

  test("accepts options with webhooks array", () => {
    const plugin = createWebhookPlugin({
      webhooks: [{ url: "https://example.com/hook", events: ["created"] }],
    });
    expect(plugin.name).toBe("webhook");
  });
});
