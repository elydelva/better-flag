import type { FlagPlugin } from "@better-flag/core";

/**
 * Audit plugin — change history. Schema contribution for bf_audit_log table.
 * Hooks: onFlagCreated, onFlagUpdated, onFlagDeleted.
 */
export function createAuditPlugin(): FlagPlugin {
  return {
    name: "audit",
    version: "1.0.0",
    schemaContribution: {
      tables: [
        {
          name: "audit_log",
          columns: {
            id: { type: "text", primaryKey: true, nullable: false },
            event: { type: "text", nullable: false },
            entityType: { type: "text", nullable: false },
            entityId: { type: "text", nullable: false },
            payload: { type: "jsonb", nullable: false },
            createdAt: { type: "timestamp", defaultValue: "now" },
          },
        },
      ],
    },
  };
}
