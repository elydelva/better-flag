import type { Flag, FlagVariant, RolloutConfig, ScheduleConfig } from "@better-flag/types";

export interface FlagRow {
  key: string;
  type: string;
  defaultValue: unknown;
  variants: unknown;
  enabled: boolean;
  rolloutPercentage: number | null;
  rolloutSalt: string | null;
  enableAt: Date | null;
  disableAt: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function rowToFlag(row: FlagRow): Flag {
  const rollout: RolloutConfig | undefined =
    row.rolloutPercentage != null
      ? { percentage: row.rolloutPercentage, seed: row.rolloutSalt ?? undefined }
      : undefined;

  const schedule: ScheduleConfig | undefined =
    row.enableAt != null || row.disableAt != null
      ? {
          start: row.enableAt?.toISOString(),
          end: row.disableAt?.toISOString(),
        }
      : undefined;

  return {
    key: row.key,
    type: row.type as Flag["type"],
    defaultValue: row.defaultValue as Flag["defaultValue"],
    variants: (row.variants as FlagVariant[] | null) ?? undefined,
    enabled: row.enabled,
    description: row.description ?? undefined,
    rollout,
    schedule,
  };
}

export interface FlagInsertRow {
  key: string;
  type: string;
  defaultValue: unknown;
  variants: unknown;
  enabled: boolean;
  rolloutPercentage: number | null;
  rolloutSalt: string | null;
  enableAt: Date | null;
  disableAt: Date | null;
  description: string | null;
}

export function flagToRow(flag: Flag): FlagInsertRow {
  return {
    key: flag.key,
    type: flag.type,
    defaultValue: flag.defaultValue,
    variants: flag.variants ?? null,
    enabled: flag.enabled ?? true,
    rolloutPercentage: flag.rollout?.percentage ?? null,
    rolloutSalt: flag.rollout?.seed ?? null,
    enableAt: flag.schedule?.start ? new Date(flag.schedule.start) : null,
    disableAt: flag.schedule?.end ? new Date(flag.schedule.end) : null,
    description: flag.description ?? null,
  };
}
