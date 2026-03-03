import { createNextHandler as createAgnosticNextHandler } from "@better-agnostic/handler-next";
import type { FlagEngine } from "@better-flag/core";
import type { EvaluationContext } from "@better-flag/types";
import type { NextRequest } from "next/server";

export interface CreateNextHandlerOptions {
  basePath?: string;
  /** Returns evaluation context (userId, attributes) from the request. Use getServerSession, JWT, etc. */
  getContext?: (req: NextRequest) => Promise<EvaluationContext | null> | EvaluationContext | null;
  /** If true, return 401 when getContext returns null for protected routes */
  requireAuth?: boolean;
}

export function createNextHandler(engine: FlagEngine, options?: CreateNextHandlerOptions) {
  const getContext = options?.getContext;
  return createAgnosticNextHandler(engine, {
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
