import type {
  EvalReason,
  EvaluationContext,
  EvaluationResult,
  Flag,
  FlagValue,
  RolloutConfig,
  ScheduleConfig,
} from "@better-flag/types";
import { hashToPercentage } from "./hash.js";

function isInSchedule(schedule: ScheduleConfig): boolean {
  const now = Date.now();
  if (schedule.start) {
    const start = new Date(schedule.start).getTime();
    if (now < start) return false;
  }
  if (schedule.end) {
    const end = new Date(schedule.end).getTime();
    if (now > end) return false;
  }
  return true;
}

/**
 * Evaluates a flag: disabled → rollout% → schedule → default.
 * Plugin hooks (override, rule, segment) are NOT implemented here — just hook points.
 */
export function evaluateFlag(flag: Flag, context: EvaluationContext): EvaluationResult {
  if (flag.enabled === false) {
    return {
      value: flag.defaultValue,
      reason: { kind: "disabled" },
    };
  }

  // Hook: override (plugins may short-circuit)
  // Hook: rule (plugins may match targeting rules)
  // Hook: segment (plugins may match segments)

  // Schedule: gate — if outside window, return default
  if (flag.schedule) {
    const active = isInSchedule(flag.schedule);
    if (!active) {
      return {
        value: flag.defaultValue,
        reason: { kind: "schedule", active: false },
      };
    }
  }

  // Rollout: if configured and userId present, bucket by percentage
  if (flag.rollout && context.userId) {
    const salt = flag.rollout.seed ?? flag.key;
    const pct = hashToPercentage(context.userId, flag.key, salt);
    const inRollout = pct < flag.rollout.percentage;
    if (inRollout) {
      const value = resolveRolloutValue(flag);
      return {
        value,
        reason: { kind: "rollout", percentage: flag.rollout.percentage },
      };
    }
  }

  return {
    value: flag.defaultValue,
    reason: { kind: "default" },
  };
}

function resolveRolloutValue(flag: Flag): FlagValue {
  if (flag.type === "variant" && flag.variants?.length) {
    // For variant flags in rollout, use first variant or default
    const first = flag.variants[0];
    return first?.value ?? flag.defaultValue;
  }
  return flag.defaultValue;
}
