import type { EvaluationContext, EvaluationResult, Flag, FlagValue } from "@better-flag/types";

export interface ClientOptions {
  baseURL: string;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  fetchFn?: typeof fetch;
}

async function request<T>(
  baseURL: string,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    fetchFn?: typeof fetch;
  }
): Promise<T> {
  const url = `${baseURL.replace(/\/$/, "")}${path}`;
  const res = await (options.fetchFn ?? fetch)(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body != null ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function createBetterFlagClient(options: ClientOptions) {
  const { baseURL, getHeaders, fetchFn } = options;

  async function headers(): Promise<Record<string, string>> {
    return (await getHeaders?.()) ?? {};
  }

  return {
    flags: {
      list: async (): Promise<Flag[]> => {
        const data = await request<Flag[]>(baseURL, "/flags", {
          headers: await headers(),
          fetchFn,
        });
        return Array.isArray(data) ? data : [];
      },
      get: async (key: string): Promise<Flag | null> => {
        const data = await request<Flag | null>(baseURL, `/flags/${encodeURIComponent(key)}`, {
          headers: await headers(),
          fetchFn,
        });
        return data;
      },
      create: async (flag: Omit<Flag, "key"> & { key: string }): Promise<Flag> => {
        return request<Flag>(baseURL, "/flags", {
          method: "POST",
          body: flag,
          headers: await headers(),
          fetchFn,
        });
      },
      update: async (key: string, patch: Partial<Flag>): Promise<Flag> => {
        return request<Flag>(baseURL, `/flags/${encodeURIComponent(key)}`, {
          method: "PATCH",
          body: patch,
          headers: await headers(),
          fetchFn,
        });
      },
      delete: async (key: string): Promise<void> => {
        await request(baseURL, `/flags/${encodeURIComponent(key)}`, {
          method: "DELETE",
          headers: await headers(),
          fetchFn,
        });
      },
    },
    evaluate: {
      forContext: async <T extends FlagValue = FlagValue>(
        context: EvaluationContext,
        keys?: string[]
      ): Promise<Record<string, EvaluationResult<T>>> => {
        const singleKey = keys != null && keys.length === 1 ? keys[0] : undefined;
        if (singleKey != null) {
          const result = await request<EvaluationResult<T>>(baseURL, "/flags/evaluate", {
            method: "POST",
            body: { key: singleKey, context },
            headers: await headers(),
            fetchFn,
          });
          return { [singleKey]: result };
        }
        const keyList = keys ?? [];
        const results: Record<string, EvaluationResult<T>> = {};
        for (const key of keyList) {
          const result = await request<EvaluationResult<T>>(baseURL, "/flags/evaluate", {
            method: "POST",
            body: { key, context },
            headers: await headers(),
            fetchFn,
          });
          results[key] = result;
        }
        return results;
      },
      one: async <T extends FlagValue = FlagValue>(
        key: string,
        context: EvaluationContext
      ): Promise<EvaluationResult<T>> => {
        return request<EvaluationResult<T>>(baseURL, "/flags/evaluate", {
          method: "POST",
          body: { key, context },
          headers: await headers(),
          fetchFn,
        });
      },
    },
  };
}

export type BetterFlagClient = ReturnType<typeof createBetterFlagClient>;
