import type { CoreRequest, CoreResponse, DispatchableEngine } from "@better-agnostic/handler";
import type { SchemaContributor } from "@better-agnostic/schema";
import { FlagNotFoundError } from "@better-flag/errors";
import type { EvaluationContext, EvaluationResult, Flag, FlagValue } from "@better-flag/types";
import type { FlagAdapter } from "./adapter.js";
import { evaluateFlag } from "./evaluate.js";
import type { FlagEngineHooks, FlagPlugin } from "./plugin.js";
import { buildRoutes } from "./routes.js";

export interface FlagConfig {
  adapter: FlagAdapter;
  plugins?: FlagPlugin[];
  tablePrefix?: string;
  generateId?: () => string;
  bootstrap?: (adapter: FlagAdapter) => Promise<void>;
  security?: Record<string, unknown>;
}

export class FlagEngine implements DispatchableEngine<EvaluationContext> {
  readonly tablePrefix: string;
  private _initDone = false;
  /** Merged hooks from all plugins */
  readonly hooks: Partial<FlagEngineHooks>;

  constructor(private readonly config: FlagConfig) {
    this.tablePrefix = config.tablePrefix ?? "bf_";
    this.hooks = this.mergePluginHooks(config.plugins ?? []);
    this.attachPluginServices();
  }

  private attachPluginServices(): void {
    for (const plugin of this.config.plugins ?? []) {
      const services = plugin.createServices?.(this);
      if (services) {
        for (const [key, svc] of Object.entries(services)) {
          (this as Record<string, unknown>)[key] = svc;
        }
      }
    }
  }

  getPlugin<T>(name: string): T | undefined {
    return (this as Record<string, unknown>)[name] as T | undefined;
  }

  /**
   * Returns schema config for CLI schema generation. Used by @better-flag/cli.
   */
  getSchemaConfigForCLI(): { tablePrefix: string; contributors: SchemaContributor[] } {
    const plugins = this.config.plugins ?? [];
    const contributors: SchemaContributor[] = [];
    for (const p of plugins) {
      if (p != null && typeof p === "object" && "schemaContribution" in p) {
        const c = p as SchemaContributor;
        if (c.schemaContribution != null) {
          contributors.push(c);
        }
      }
    }
    return {
      tablePrefix: this.tablePrefix,
      contributors,
    };
  }

  getAdapter(): FlagAdapter {
    return this.config.adapter;
  }

  async init(): Promise<void> {
    if (this._initDone) return;
    await this.config.adapter.onReady();
    if (this.config.bootstrap) {
      await this.config.bootstrap(this.config.adapter);
    }
    for (const plugin of this.config.plugins ?? []) {
      if (plugin.init) {
        await plugin.init(this);
      }
    }
    this._initDone = true;
  }

  getRoutes(): Array<{
    method: string;
    path: string;
    handler: (ctx: unknown) => Promise<CoreResponse> | CoreResponse;
  }> {
    const routes = buildRoutes(this.config.plugins);
    return routes.map((r) => ({
      method: r.method,
      path: r.path,
      handler: (ctx: unknown) => r.handler(ctx as { engine: FlagEngine; req: CoreRequest }),
    }));
  }

  async evaluate<T extends FlagValue = FlagValue>(
    flagKey: string,
    context: EvaluationContext
  ): Promise<EvaluationResult<T>> {
    const flag = await this.config.adapter.flags.get(flagKey);
    if (!flag) {
      throw new FlagNotFoundError(flagKey);
    }

    const evaluators = this.collectEvaluators();
    for (const ev of evaluators) {
      const result = await ev.evaluate(flag, context);
      if (result != null) return result as EvaluationResult<T>;
    }

    return evaluateFlag(flag, context) as EvaluationResult<T>;
  }

  private collectEvaluators(): import("./plugin.js").FlagEvaluator[] {
    const out: import("./plugin.js").FlagEvaluator[] = [];
    for (const p of this.config.plugins ?? []) {
      for (const ev of p.evaluators ?? []) {
        out.push(ev);
      }
    }
    out.sort((a, b) => b.priority - a.priority);
    return out;
  }

  private mergePluginHooks(plugins: FlagPlugin[]): Partial<FlagEngineHooks> {
    const merged: Partial<FlagEngineHooks> = {};
    for (const p of plugins) {
      if (p.hooks) {
        Object.assign(merged, p.hooks);
      }
    }
    return merged;
  }
}
