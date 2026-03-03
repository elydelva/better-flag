import type { FlagPlugin } from "@better-flag/core";

export interface WebhookConfig {
  url: string;
  secret?: string;
  events?: Array<"created" | "updated" | "deleted">;
}

export interface WebhookPluginOptions {
  webhooks?: WebhookConfig[];
}

/**
 * Webhook plugin — HTTP notifications on flag changes.
 * Hooks: onFlagCreated, onFlagUpdated, onFlagDeleted → POST to URLs.
 */
export function createWebhookPlugin(options: WebhookPluginOptions = {}): FlagPlugin {
  return {
    name: "webhook",
    version: "1.0.0",
    // TODO: implement hooks that POST to webhooks
  };
}
