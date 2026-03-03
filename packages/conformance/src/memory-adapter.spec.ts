import { createInMemoryFlagAdapter } from "@better-flag/adapter-memory";
import { runConformanceTests } from "./index.js";

runConformanceTests({
  adapter: createInMemoryFlagAdapter(),
});
