# codex-subagents-mcp

[![CI](https://github.com/leonardsellem/codex-subagents-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/leonardsellem/codex-subagents-mcp/actions/workflows/ci.yml)
![Node >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

File-based Codex sub-agents served over MCP. Every agent is a plain file you can review, diff, and ship like application code.

- **Auditable by design** – personas live in `agents/*.md|json` and load without rebuilding.
- **Safe defaults** – orchestration injects tokens, isolates workdirs, and mirrors repos only when asked.
- **CLI-first** – exposes one main tool (`delegate`) plus helpers (`list_agents`, `validate_agents`).

## What’s new in this fork

- Automatic token injection in orchestration envelopes (no manual `token="<server-injected-token>"` required).
- `SUBAGENTS_DISABLE_CODEX=1` bypass switch for tests/CI: the server short-circuits Codex execs with code `127` so Vitest runs deterministically.
- OAuth-friendly E2E flow – `scripts/e2e.sh` reuses `~/.codex/auth.json` and hits `gpt-5-codex` without custom API keys.

## Requirements

- Node.js >= 18 and npm
- Codex CLI `@openai/codex` (>= 0.42.0) installed and on PATH
- Codex account with access to `gpt-5-codex` (or adjust profiles accordingly)
- Optional: Bash (WSL, macOS, or Git Bash) for running `scripts/e2e.sh`

## Install & Build

```bash
npm install
npm run build
```

The build emits `dist/codex-subagents.mcp.js`, the entry point you pass to Codex CLI.

## Configure Codex CLI

1. Authenticate once:
   ```bash
   codex auth login
   ```
2. Add the MCP server and profiles in `~/.codex/config.toml`:
   ```toml
   [profiles.default]
   model = "gpt-5-codex"
   approval_policy = "never"
   sandbox_mode = "read-only"

   [profiles.review]
   model = "gpt-5-codex"
   approval_policy = "on-request"
   sandbox_mode = "workspace-write"

   [profiles.debugger]
   model = "gpt-5-codex"
   approval_policy = "on-request"
   sandbox_mode = "workspace-write"

   [profiles.security]
   model = "gpt-5-codex"
   approval_policy = "never"
   sandbox_mode = "read-only"

   [mcp_servers.subagents]
   command = "/usr/bin/env"
   args    = ["node", "/ABS/PATH/dist/codex-subagents.mcp.js", "--agents-dir", "/ABS/PATH/agents"]
   startup_timeout_sec = 15
   tool_timeout_sec = 120
   ```

3. (Optional) if you keep agents elsewhere, set `CODEX_SUBAGENTS_DIR=/abs/path/agents`.

## Run the server

- Development (auto TS transpile):
  ```bash
  npm run dev
  ```
- Production / compiled:
  ```bash
  npm start
  ```

When Codex connects it discovers tools automatically. Verify from the CLI:
```bash
/tools.call name=list_agents
/tools.call name=validate_agents
```

Delegate work either directly or through the orchestrator:
```bash
subagents.delegate(agent="reviewer", task="Kurzer Smoke-Test für dieses Repo")
subagents.delegate(agent="orchestrator", task="Audit the repo for secrets")
```

## Testing & Diagnostics

| Command | Purpose |
| ------- | ------- |
| `npm test` | Runs Vitest suites (`pool: threads`). Tests set `SUBAGENTS_DISABLE_CODEX=1` so they do not require Codex CLI. |
| `npm run lint` | ESLint + `@typescript-eslint`. (Current config emits a warning on TS 5.9.x; functionality is unaffected.) |
| `npm run e2e` | Launches the built server, copies `~/.codex/auth.json`, and executes a smoke delegation against `gpt-5-codex`. Requires network access to `https://chatgpt.com/backend-api/codex/responses`. |

Troubleshooting tips:
- If `npm run e2e` fails with `401 Unauthorized`, re-run `codex auth login` and ensure your account has access to the selected model.
- `error sending request ... clouds` usually means network policy blocking `chatgpt.com`; allow outbound HTTPS to that host.
- Set `DEBUG_MCP=1` before `npm start` for verbose framing logs.

## Custom agents

Agents are plain Markdown or JSON files whose basename becomes the agent key:
```md
---
profile: review
approval_policy: on-request
sandbox_mode: workspace-write
---
You are a pragmatic reviewer...
```

The loader walks these locations in order:
1. `--agents-dir` CLI argument
2. `CODEX_SUBAGENTS_DIR` environment variable
3. `./agents` or `./.codex-subagents/agents`
4. `dist/../agents`

List the current registry any time with `tools.call name=list_agents`. Validate formatting with `tools.call name=validate_agents`.

### Ad-hoc agents

You can execute a persona without creating a file by providing both `profile` and `persona` in the tool call:
```bash
subagents.delegate(
  agent="perf",
  task="Trace render jank in dashboard",
  profile="debugger",
  sandbox_mode="workspace-write",
  persona="You are a pragmatic performance analyst..."
)
```

## Known limitations

- `@typescript-eslint` warns for TypeScript 5.9.x (the current toolchain still works). Downgrade TS to 5.5.x or upgrade ESLint plugins once new releases land if you want a warning-free lint run.
- MCP servers run outside Codex’s sandbox; keep agent personas narrow and review third-party contributions.

## More documentation

- [`docs/INTEGRATION.md`](docs/INTEGRATION.md) – Git worktree mirroring, deployment tips
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) – logging, troubleshooting, orchestration artifacts
- [`docs/SECURITY.md`](docs/SECURITY.md) – threat model & hardening
- [`docs/ORCHESTRATION.md`](docs/ORCHESTRATION.md) – envelope format and token gating

Happy delegating! 🚀
