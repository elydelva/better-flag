# better-flags

A **headless feature flags engine** for TypeScript/JavaScript. Define flags (boolean, string, variant) with rollout, targeting, and schedule — without coupling to a specific framework or database. Same philosophy as better-auth — interface-first.

## Install

```bash
bun add @better-flag/core @better-flag/adapter-memory @better-flag/handler-hono
```

## Usage

```ts
import { betterFlags } from "@better-flag/core";
import { createMemoryAdapter } from "@better-flag/adapter-memory";
import { createHonoHandler } from "@better-flag/handler-hono";

const adapter = createMemoryAdapter();
const engine = betterFlags({ adapter });

// Mount HTTP API
const handler = createHonoHandler(engine, { getContext: () => ({}) });
app.route("/flags", handler);
```

## Packages

| Package | Description |
|---------|-------------|
| `@better-flag/core` | Engine, flags, evaluate, routes |
| `@better-flag/types` | Flag types, context, evaluation result |
| `@better-flag/errors` | FlagNotFoundError, EvaluationError |
| `@better-flag/handler-hono` | Hono bridge |
| `@better-flag/handler-express` | Express bridge |
| `@better-flag/handler-fastify` | Fastify bridge |
| `@better-flag/handler-next` | Next.js bridge |
| `@better-flag/adapter-memory` | In-memory adapter for dev/E2E |
| `@better-flag/adapter-file` | File-based adapter |
| `@better-flag/adapter-redis` | Redis adapter |
| `@better-flag/adapter-drizzle` | Drizzle adapter |
| `@better-flag/client` | HTTP client for flags API |
| `@better-flag/cli` | CLI for migrations and config |

## Development

```bash
bun install
bun run test
bun run lint
bun run typecheck
```

## License

MIT — see [LICENSE](LICENSE)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
