import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFileFlagAdapter } from "./index.js";

describe("createFileFlagAdapter", () => {
  test("get returns null for unknown key before any set", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "bf-file-"));
    try {
      const filePath = join(tmpDir, "flags.json");
      await Bun.write(filePath, "[]");
      const adapter = createFileFlagAdapter(filePath);
      await adapter.onReady();
      const flag = await adapter.flags.get("unknown");
      expect(flag).toBeNull();
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("set and get round-trip persists to file", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "bf-file-"));
    try {
      const filePath = join(tmpDir, "flags.json");
      await Bun.write(filePath, "[]");
      const adapter = createFileFlagAdapter(filePath);
      await adapter.onReady();
      await adapter.flags.set({
        key: "persisted",
        type: "boolean",
        defaultValue: true,
        enabled: true,
      });
      const got = await adapter.flags.get("persisted");
      expect(got).not.toBeNull();
      expect(got?.key).toBe("persisted");
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("load from file with invalid JSON treats as empty", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "bf-file-"));
    try {
      const filePath = join(tmpDir, "flags.json");
      await Bun.write(filePath, "not valid json {{{");
      const adapter = createFileFlagAdapter(filePath);
      await adapter.onReady();
      const all = await adapter.flags.getAll();
      expect(all).toEqual([]);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("load when file does not exist uses empty array fallback", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "bf-file-"));
    try {
      const filePath = join(tmpDir, "nonexistent.json");
      const adapter = createFileFlagAdapter(filePath);
      await adapter.onReady();
      const all = await adapter.flags.getAll();
      expect(all).toEqual([]);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("delete removes flag from file", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "bf-file-"));
    try {
      const filePath = join(tmpDir, "flags.json");
      await Bun.write(filePath, "[]");
      const adapter = createFileFlagAdapter(filePath);
      await adapter.onReady();
      await adapter.flags.set({
        key: "gone",
        type: "boolean",
        defaultValue: false,
      });
      await adapter.flags.delete("gone");
      const got = await adapter.flags.get("gone");
      expect(got).toBeNull();
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
