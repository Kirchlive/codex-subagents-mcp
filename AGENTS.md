# Repository Guidelines

## Project Structure & Module Organization
- `src/` hosts the TypeScript MCP server; `codex-subagents.mcp.ts` wires tools and loading, with helpers in sibling modules. Keep new modules cohesive and export minimal surfaces.
- `agents/` contains sample personas; new definitions must use the basename as the agent key (e.g., `agents/review.md` → `review`).
- `tests/` mirrors runtime behavior with Vitest suites (`*.test.ts`). Add fixtures under `tests/fixtures/` if suites grow.
- `docs/` provides integration, security, and operations playbooks—update when behavior changes. Build artifacts land in `dist/` and should stay unversioned.
- `scripts/` holds developer utilities like `scripts/e2e.sh`; prefer extending these instead of duplicating logic.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run build` compiles TypeScript into `dist/`.
- `npm run dev` starts the MCP server via `tsx` for iterative work.
- `npm start` runs the compiled stdio server; mirrors production usage.
- `npm run lint` applies ESLint + TypeScript rules.
- `npm test` executes Vitest suites; `npm run e2e` runs the Codex CLI smoke flow (requires Codex installed).

## Coding Style & Naming Conventions
- Use TypeScript with 2-space indentation, trailing commas where TS allows, and named exports for shared helpers.
- Follow the ESLint config (`@typescript-eslint/recommended`); silence unused parameters with a leading `_`.
- Agent files should be lowercase, hyphenated basenames (`agents/security.json`, `agents/perf.md`) describing their specialty.

## Testing Guidelines
- Write Vitest specs alongside related suites using the `FeatureName.test.ts` pattern; cover both success and failure paths.
- Include regression tests for bugs and update fixtures when agent loading or orchestration changes.
- For cross-tool validation, run `npm run e2e` and capture notable output in the PR description.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes (`docs:`, `test:`, `fix:`) as seen in `git log`; keep subjects imperative and under ~70 chars.
- Each PR should summarize intent, list validation commands, link issues, and note doc updates (README, `docs/*`, `AGENTS.md`).
- Exclude `dist/` changes and keep PRs focused; open follow-ups for unrelated improvements.

## Agent Registry Tips
- Validate definitions before merging with `tools.call name=validate_agents`.
- When adding a new persona, document its profile and sandbox defaults in the PR and update `docs/OPERATIONS.md` if workflow changes.
