import { createFastifyHandler as createAgnosticFastifyHandler } from "@better-agnostic/handler-fastify";
import type { FlagEngine } from "@better-flag/core";
import type { EvaluationContext } from "@better-flag/types";
import type { FastifyRequest } from "fastify";

export interface CreateFastifyHandlerOptions {
  basePath?: string;
  /** Returns evaluation context (userId, attributes) from the request. Use session, JWT, etc. */
  getContext?: (
    req: FastifyRequest
  ) => Promise<EvaluationContext | null> | EvaluationContext | null;
  /** If true, return 401 when getContext returns null for protected routes */
  requireAuth?: boolean;
}

export function createFastifyHandler(engine: FlagEngine, options?: CreateFastifyHandlerOptions) {
  const getContext = options?.getContext;
  return createAgnosticFastifyHandler(engine, {
    basePath: options?.basePath,
    getAuthContext: getContext
      ? async (req) => {
          const ctx = await Promise.resolve(getContext(req));
          return ctx ?? null;
        }
      : undefined,
    requireAuth: options?.requireAuth,
  });
}
