import { parseBody, parseLimit, successResponse } from "@better-agnostic/handler";
import type { CoreRequest, CoreResponse, RouteHandler } from "@better-agnostic/handler";
import { FlagNotFoundError, FlagValidationError } from "@better-flag/errors";
import type { EvaluationContext, Flag, FlagValue, TargetingRule } from "@better-flag/types";
import { z } from "zod";
import type { FlagEngine } from "./engine.js";

const flagCreateSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["boolean", "string", "number", "json", "variant"]),
  defaultValue: z.union([z.boolean(), z.string(), z.number(), z.record(z.string(), z.unknown())]),
  variants: z
    .array(
      z.object({
        key: z.string(),
        value: z.union([z.boolean(), z.string(), z.number(), z.record(z.string(), z.unknown())]),
        weight: z.number().optional(),
      })
    )
    .optional(),
  enabled: z.boolean().optional(),
  description: z.string().optional(),
  rollout: z
    .object({
      percentage: z.number().min(0).max(100),
      seed: z.string().optional(),
    })
    .optional(),
  schedule: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  rules: z.array(z.any()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const flagUpdateSchema = flagCreateSchema.partial().omit({ key: true });

const evaluateSchema = z.object({
  key: z.string().min(1),
  context: z
    .object({
      userId: z.string().optional(),
      attributes: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

type HandlerCtx = {
  engine: FlagEngine;
  req: CoreRequest;
};

export const handleFlagsList: RouteHandler<FlagEngine> = async ({
  engine,
  req,
}: HandlerCtx): Promise<CoreResponse> => {
  const limit = parseLimit(req.query.limit, 50);
  const flags = await engine.getAdapter().flags.getAll();
  const limited = flags.slice(0, limit);
  return successResponse(limited);
};

export const handleFlagsGet: RouteHandler<FlagEngine> = async ({
  engine,
  req,
}: HandlerCtx): Promise<CoreResponse> => {
  const key = req.params.key;
  if (!key) throw new FlagValidationError("Missing flag key");
  const flag = await engine.getAdapter().flags.get(key);
  if (!flag) throw new FlagNotFoundError(key);
  return successResponse(flag);
};

export const handleFlagsCreate: RouteHandler<FlagEngine> = async ({
  engine,
  req,
}: HandlerCtx): Promise<CoreResponse> => {
  const data = parseBody(req, flagCreateSchema);
  const flag: Flag = {
    key: data.key,
    type: data.type,
    defaultValue: data.defaultValue,
    variants: data.variants,
    enabled: data.enabled,
    description: data.description,
    rollout: data.rollout,
    schedule: data.schedule,
    rules: (data.rules ?? undefined) as TargetingRule[] | undefined,
    metadata: data.metadata,
  };
  await engine.getAdapter().flags.set(flag);
  return successResponse(flag, 201);
};

export const handleFlagsUpdate: RouteHandler<FlagEngine> = async ({
  engine,
  req,
}: HandlerCtx): Promise<CoreResponse> => {
  const key = req.params.key;
  if (!key) throw new FlagValidationError("Missing flag key");
  const existing = await engine.getAdapter().flags.get(key);
  if (!existing) throw new FlagNotFoundError(key);
  const data = parseBody(req, flagUpdateSchema);
  const flag: Flag = {
    ...existing,
    ...data,
    rules: (data.rules ?? existing.rules) as TargetingRule[] | undefined,
  };
  await engine.getAdapter().flags.set(flag);
  return successResponse(flag);
};

export const handleFlagsDelete: RouteHandler<FlagEngine> = async ({
  engine,
  req,
}: HandlerCtx): Promise<CoreResponse> => {
  const key = req.params.key;
  if (!key) throw new FlagValidationError("Missing flag key");
  const existing = await engine.getAdapter().flags.get(key);
  if (!existing) throw new FlagNotFoundError(key);
  await engine.getAdapter().flags.delete(key);
  return successResponse({ deleted: true }, 200);
};

export const handleFlagsEvaluate: RouteHandler<FlagEngine> = async ({
  engine,
  req,
}: HandlerCtx): Promise<CoreResponse> => {
  const rateLimit = engine.getPlugin<{ checkAndRecord: (key: string) => Promise<void> }>(
    "rateLimit"
  );
  if (rateLimit) {
    const clientKey = (req.auth as { userId?: string } | undefined)?.userId ?? "anonymous";
    await rateLimit.checkAndRecord(clientKey);
  }

  const parsed = evaluateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new FlagValidationError("Invalid evaluate body", {
      metadata: { issues: parsed.error.issues },
    });
  }
  const { key, context } = parsed.data;
  const ctx: EvaluationContext = {
    userId: context?.userId,
    attributes: context?.attributes as Record<string, FlagValue> | undefined,
  };
  // Use req.auth as EvaluationContext when provided (e.g. userId from auth)
  const authCtx = req.auth as EvaluationContext | undefined;
  const mergedAttrs = {
    ...(authCtx?.attributes ?? {}),
    ...(ctx.attributes ?? {}),
  };
  const attrs: Record<string, FlagValue> | undefined =
    Object.keys(mergedAttrs).length > 0
      ? (mergedAttrs as unknown as Record<string, FlagValue>)
      : undefined;
  const mergedContext: EvaluationContext = {
    userId: authCtx?.userId ?? ctx.userId,
    attributes: attrs,
  };
  const result = await engine.evaluate(key, mergedContext);
  return successResponse(result);
};
