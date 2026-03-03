import type { FlagPlugin } from "@better-flag/core";

/**
 * Rules plugin — conditional targeting. Schema contribution for bf_rules table.
 * Full implementation: evaluator that matches conditions against context.
 */
export function createRulesPlugin(): FlagPlugin {
  return {
    name: "rules",
    version: "1.0.0",
    schemaContribution: {
      tables: [
        {
          name: "rules",
          columns: {
            id: { type: "text", primaryKey: true, nullable: false },
            flagKey: { type: "text", nullable: false },
            priority: { type: "integer", nullable: false },
            conditions: { type: "jsonb", nullable: false },
            value: { type: "jsonb", nullable: false },
            createdAt: { type: "timestamp", defaultValue: "now" },
          },
        },
      ],
    },
  };
}
