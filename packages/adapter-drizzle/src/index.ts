import type { SchemaContributor } from "@better-agnostic/schema";
import type { Flag, FlagAdapter } from "@better-flag/core";
import { eq } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { type FlagRow, flagToRow, rowToFlag } from "./mapper.js";
import { buildFlagsSchema } from "./schema.js";

/** Table shape with key column - from translateToDrizzle (pg or sqlite) */
interface FlagsTableWithKey {
  key: PgColumn | SQLiteColumn;
}

export interface DrizzleAdapterOptions {
  provider: "pg" | "sqlite";
  tablePrefix?: string;
  generateId?: () => string;
  plugins?: SchemaContributor[];
}

/** Minimal Drizzle db interface for CRUD. Compatible with pg and sqlite drivers. */
interface DrizzleDbLike {
  select(): {
    from<T>(table: T): Promise<FlagRow[]> & { where(condition: unknown): Promise<FlagRow[]> };
  };
  insert<T>(table: T): { values(values: Record<string, unknown>): Promise<unknown> };
  update<T>(table: T): {
    set(values: Record<string, unknown>): { where(condition: unknown): Promise<unknown> };
  };
  delete<T>(table: T): { where(condition: unknown): Promise<unknown> };
}

/**
 * Drizzle ORM adapter for better-flag. Supports PostgreSQL and SQLite via translateToDrizzle.
 * Uses buildSchema from @better-agnostic/schema with base flags contribution + plugins.
 */
export function drizzleAdapter(db: DrizzleDbLike, options: DrizzleAdapterOptions): FlagAdapter {
  const prefix = options.tablePrefix ?? "bf_";
  const tableName = `${prefix}flags`;
  const schema = buildFlagsSchema(options.plugins ?? [], {
    provider: options.provider,
    tablePrefix: prefix,
  });
  const table = schema[tableName];
  if (!table || typeof table !== "object") {
    throw new Error(`Flags table "${tableName}" not found in schema`);
  }

  const t = table as FlagsTableWithKey;
  const keyCol = t.key;

  return {
    flags: {
      get: async (key: string): Promise<Flag | null> => {
        const rows = await db.select().from(t).where(eq(keyCol, key));
        const r = rows[0];
        return r ? rowToFlag(r) : null;
      },
      getAll: async (): Promise<Flag[]> => {
        const rows = await db.select().from(t);
        return rows.map(rowToFlag);
      },
      set: async (flag: Flag): Promise<void> => {
        const r = flagToRow(flag);
        const existing = await db.select().from(t).where(eq(keyCol, flag.key));
        if (existing.length > 0) {
          await db
            .update(t)
            .set({ ...r, updatedAt: new Date() })
            .where(eq(keyCol, flag.key));
        } else {
          await db.insert(t).values({
            ...r,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      },
      delete: async (key: string): Promise<void> => {
        await db.delete(t).where(eq(keyCol, key));
      },
    },
    extensions: {},
    onReady: async () => {},
  };
}

export { buildFlagsSchema } from "./schema.js";
export type { FlagRow, FlagInsertRow } from "./mapper.js";
