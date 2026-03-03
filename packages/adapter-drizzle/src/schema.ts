import { translateToDrizzle } from "@better-agnostic/adapter-drizzle";
import type { SchemaContribution, SchemaContributor } from "@better-agnostic/schema";
import { buildSchema } from "@better-agnostic/schema";

const flagsSchemaContribution: SchemaContribution = {
  tables: [
    {
      name: "flags",
      columns: {
        key: { type: "text", primaryKey: true, nullable: false },
        type: { type: "text", nullable: false },
        defaultValue: { type: "jsonb" },
        variants: { type: "jsonb" },
        enabled: { type: "boolean", nullable: false, defaultValue: true },
        rolloutPercentage: { type: "integer" },
        rolloutSalt: { type: "text" },
        enableAt: { type: "timestamp" },
        disableAt: { type: "timestamp" },
        description: { type: "text" },
        createdAt: { type: "timestamp", nullable: false, defaultValue: "now" },
        updatedAt: { type: "timestamp", nullable: false, defaultValue: "now" },
      },
    },
  ],
};

export function buildFlagsSchema(
  plugins: SchemaContributor[],
  options: { provider: "pg" | "sqlite"; tablePrefix?: string }
): Record<string, unknown> {
  const baseContributor: SchemaContributor = {
    schemaContribution: flagsSchemaContribution,
  };
  const merged = buildSchema([baseContributor, ...plugins], {
    tablePrefix: options.tablePrefix,
  });
  return translateToDrizzle(merged, {
    provider: options.provider,
    tablePrefix: options.tablePrefix,
  });
}
