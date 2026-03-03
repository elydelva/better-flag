import type { FlagPlugin } from "@better-flag/core";
import type { EvaluationContext, Flag, FlagValue } from "@better-flag/types";
import type { OverridesStore } from "./OverridesStore.interface.js";
import { createInMemoryOverridesStore } from "./createInMemoryOverridesStore.js";

export { createInMemoryOverridesStore } from "./createInMemoryOverridesStore.js";
export type { OverridesStore } from "./OverridesStore.interface.js";

export interface OverridesPluginOptions {
  store?: OverridesStore;
  /** Key to use for override lookup (default: userId from context) */
  getContextKey?: (context: EvaluationContext) => string | null;
}

/**
 * Overrides plugin. Highest priority evaluator — returns manual override if set.
 */
export function createOverridesPlugin(options: OverridesPluginOptions = {}): FlagPlugin {
  const store = options.store ?? createInMemoryOverridesStore();
  const getContextKey = options.getContextKey ?? ((ctx) => ctx.userId ?? null);

  return {
    name: "overrides",
    version: "1.0.0",

    evaluators: [
      {
        priority: 1000,
        evaluate: async (
          flag: Flag,
          context: EvaluationContext
        ): Promise<{ value: FlagValue; reason: { kind: "override" } } | null> => {
          const contextKey = getContextKey(context);
          if (!contextKey) return null;
          const value = await store.get(flag.key, contextKey);
          if (value == null) return null;
          return { value, reason: { kind: "override" } };
        },
      },
    ],

    createServices: () => ({ overrides: store }),

    schemaContribution: {
      tables: [
        {
          name: "overrides",
          columns: {
            id: { type: "text", primaryKey: true, nullable: false },
            flagKey: { type: "text", nullable: false },
            contextKey: { type: "text", nullable: false },
            value: { type: "jsonb", nullable: false },
            createdAt: { type: "timestamp", defaultValue: "now" },
          },
          uniqueConstraints: [{ columns: ["flagKey", "contextKey"] }],
        },
      ],
    },
  };
}
