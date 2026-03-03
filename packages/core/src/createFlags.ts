import type { Flag, FlagType, FlagValue } from "@better-flag/types";

/** Definition for a single flag (without key) */
export interface FlagDefinition {
  type: FlagType;
  defaultValue: FlagValue;
  variants?: Array<{ key: string; value: FlagValue; weight?: number }>;
  enabled?: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}

/** Map of flag key to definition */
export type FlagsDefinition = Record<string, FlagDefinition>;

/** Creates a flags definition map from key-value pairs. */
export function createFlags(definitions: FlagsDefinition): Flag[] {
  return Object.entries(definitions).map(([key, def]) => ({
    key,
    type: def.type,
    defaultValue: def.defaultValue,
    variants: def.variants,
    enabled: def.enabled,
    description: def.description,
    metadata: def.metadata,
  }));
}
