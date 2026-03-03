import { createCli } from "@better-agnostic/cli";
import type { SchemaContributor } from "@better-agnostic/schema";

export function runCli(): void {
  createCli({
    name: "bf",
    version: "0.0.0",
    configNames: ["flag.ts", "flags.ts"],
    searchDirs: [".", "src", "lib", "app", "server"],
    exportNames: ["default", "engine", "flag", "flags", "bf"],
    getSchemaConfig: (engine: unknown) => {
      const e = engine as {
        getSchemaConfigForCLI?: () => { tablePrefix: string; contributors: SchemaContributor[] };
      };
      if (typeof e.getSchemaConfigForCLI === "function") {
        return e.getSchemaConfigForCLI();
      }
      return { tablePrefix: "bf_", contributors: [] as SchemaContributor[] };
    },
  });
}
