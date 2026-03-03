# Contributing

Thanks for your interest in contributing to better-flag.

## Setup

```bash
bun install
```

## Commands

- `bun run test` — Run tests
- `bun run lint` — Lint with Biome
- `bun run format` — Format code
- `bun run check` — Lint + format + organize imports
- `bun run typecheck` — TypeScript check
- `bun run changeset` — Add a changeset for your changes

## Conventions

- Use **Biome** for linting and formatting (no ESLint/Prettier)
- Use **bun test** for tests
- Use **Conventional Commits** for commit messages when possible (feat:, fix:, docs:, etc.)

## Adding a changeset

When you make a change that affects a package's public API, run:

```bash
bun run changeset
```

Select the packages affected and describe the change. This will create a file in `.changeset/` to be committed with your PR.
