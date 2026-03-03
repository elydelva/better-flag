import { describe, expect, test } from "bun:test";
import { createBetterFlagClient } from "./index.js";

describe("createBetterFlagClient", () => {
  test("flags.list returns array from GET /flags", async () => {
    const mockFetch = async (url: string) => {
      expect(url).toContain("/flags");
      return new Response(JSON.stringify([{ key: "f1", type: "boolean", defaultValue: true }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const client = createBetterFlagClient({
      baseURL: "http://test",
      fetchFn: mockFetch as typeof fetch,
    });
    const flags = await client.flags.list();
    expect(Array.isArray(flags)).toBe(true);
    expect(flags[0]?.key).toBe("f1");
  });

  test("flags.get returns flag from GET /flags/:key", async () => {
    const mockFetch = async (url: string) => {
      expect(url).toContain("/flags/my-flag");
      return new Response(
        JSON.stringify({ key: "my-flag", type: "boolean", defaultValue: false }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };
    const client = createBetterFlagClient({
      baseURL: "http://test",
      fetchFn: mockFetch as typeof fetch,
    });
    const flag = await client.flags.get("my-flag");
    expect(flag?.key).toBe("my-flag");
  });

  test("flags.create sends POST with body", async () => {
    let capturedBody: unknown = null;
    const mockFetch = async (_url: string, init?: RequestInit) => {
      capturedBody = init?.body ? JSON.parse(init.body as string) : null;
      return new Response(JSON.stringify({ key: "new", type: "boolean", defaultValue: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const client = createBetterFlagClient({
      baseURL: "http://test",
      fetchFn: mockFetch as typeof fetch,
    });
    await client.flags.create({
      key: "new",
      type: "boolean",
      defaultValue: true,
    });
    expect(capturedBody).toEqual({ key: "new", type: "boolean", defaultValue: true });
  });

  test("flags.update sends PATCH with body", async () => {
    let capturedBody: unknown = null;
    const mockFetch = async (_url: string, init?: RequestInit) => {
      capturedBody = init?.body ? JSON.parse(init.body as string) : null;
      return new Response(
        JSON.stringify({ key: "x", type: "boolean", defaultValue: true, enabled: false }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };
    const client = createBetterFlagClient({
      baseURL: "http://test",
      fetchFn: mockFetch as typeof fetch,
    });
    await client.flags.update("x", { enabled: false });
    expect(capturedBody).toEqual({ enabled: false });
  });

  test("flags.delete sends DELETE", async () => {
    let method = "";
    const mockFetch = async (_url: string, init?: RequestInit) => {
      method = init?.method ?? "";
      return new Response(null, { status: 204 });
    };
    const client = createBetterFlagClient({
      baseURL: "http://test",
      fetchFn: mockFetch as typeof fetch,
    });
    await client.flags.delete("to-delete");
    expect(method).toBe("DELETE");
  });

  test("evaluate.one returns result from POST /flags/evaluate", async () => {
    const mockFetch = async (_url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(init.body as string) : null;
      expect(body?.key).toBe("f1");
      return new Response(JSON.stringify({ value: true, reason: { kind: "default" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const client = createBetterFlagClient({
      baseURL: "http://test",
      fetchFn: mockFetch as typeof fetch,
    });
    const result = await client.evaluate.one("f1", { userId: "u1" });
    expect(result.value).toBe(true);
    expect(result.reason).toEqual({ kind: "default" });
  });

  test("throws on non-ok response", async () => {
    const mockFetch = async () =>
      new Response(JSON.stringify({ message: "Not found", code: "NOT_FOUND" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    const client = createBetterFlagClient({
      baseURL: "http://test",
      fetchFn: mockFetch as typeof fetch,
    });
    await expect(client.flags.get("missing")).rejects.toThrow("Not found");
  });

  test("evaluate.forContext with single key sends one POST", async () => {
    let capturedKey = "";
    const mockFetch = async (_url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(init.body as string) : null;
      capturedKey = body?.key ?? "";
      return new Response(JSON.stringify({ value: true, reason: { kind: "default" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const client = createBetterFlagClient({
      baseURL: "http://test",
      fetchFn: mockFetch as typeof fetch,
    });
    const result = await client.evaluate.forContext({ userId: "u1" }, ["only-one"]);
    expect(result).toEqual({ "only-one": { value: true, reason: { kind: "default" } } });
    expect(capturedKey).toBe("only-one");
  });

  test("evaluate.forContext with multiple keys sends one POST per key", async () => {
    const calls: { key: string }[] = [];
    const mockFetch = async (_url: string, init?: RequestInit) => {
      const body = init?.body ? JSON.parse(init.body as string) : null;
      if (body?.key) calls.push({ key: body.key });
      return new Response(JSON.stringify({ value: true, reason: { kind: "default" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const client = createBetterFlagClient({
      baseURL: "http://test",
      fetchFn: mockFetch as typeof fetch,
    });
    const result = await client.evaluate.forContext({ userId: "u1" }, [
      "flag-a",
      "flag-b",
      "flag-c",
    ]);
    expect(Object.keys(result)).toEqual(["flag-a", "flag-b", "flag-c"]);
    expect(calls).toHaveLength(3);
    expect(calls.map((c) => c.key)).toEqual(["flag-a", "flag-b", "flag-c"]);
  });

  test("evaluate.forContext with empty keys returns empty object", async () => {
    let callCount = 0;
    const mockFetch = async () => {
      callCount++;
      return new Response(JSON.stringify({ value: true, reason: { kind: "default" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const client = createBetterFlagClient({
      baseURL: "http://test",
      fetchFn: mockFetch as typeof fetch,
    });
    const result = await client.evaluate.forContext({ userId: "u1" }, []);
    expect(result).toEqual({});
    expect(callCount).toBe(0);
  });

  test("getHeaders merges custom headers", async () => {
    let capturedHeaders: Record<string, string> = {};
    const mockFetch = async (_url: string, init?: RequestInit) => {
      capturedHeaders = (init?.headers as Record<string, string>) ?? {};
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const client = createBetterFlagClient({
      baseURL: "http://test",
      getHeaders: () => ({ Authorization: "Bearer token123" }),
      fetchFn: mockFetch as typeof fetch,
    });
    await client.flags.list();
    expect(capturedHeaders.Authorization).toBe("Bearer token123");
  });
});
