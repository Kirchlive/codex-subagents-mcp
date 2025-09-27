#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=$(cd "$(dirname "$0")/.." && pwd)
SERVER="$REPO_DIR/dist/codex-subagents.mcp.js"
AGENTS_DIR="$REPO_DIR/agents"
NODE_BIN=$(command -v node)

npm run build >/tmp/e2e-build.log

TMP_HOME=$(mktemp -d)
REAL_HOME=${HOME:-""}
mkdir -p "$TMP_HOME/.codex"
cat > "$TMP_HOME/.codex/config.toml" <<CONFIG
[profiles.default]
model = "gpt-5-codex"
approval_policy = "never"
sandbox_mode = "read-only"

[mcp_servers.subagents]
command = "$NODE_BIN"
args = ["$SERVER", "--agents-dir", "$AGENTS_DIR"]
CONFIG

if [ -n "$REAL_HOME" ] && [ -f "$REAL_HOME/.codex/auth.json" ]; then
  cp "$REAL_HOME/.codex/auth.json" "$TMP_HOME/.codex/auth.json"
fi

# list connected MCP servers
echo "Listing MCP servers..." >&2
LIST_OUTPUT=$(HOME="$TMP_HOME" npx --yes @openai/codex exec -m gpt-5-codex "/mcp" 2>&1)
echo "$LIST_OUTPUT"
echo "$LIST_OUTPUT" | grep -q "codex-subagents"

# pick first agent
AGENT=$(ls "$AGENTS_DIR" | head -n 1 | sed 's/\.[^.]*$//')

echo "Delegating to agent: $AGENT" >&2
DELEGATE_OUTPUT=$(HOME="$TMP_HOME" npx --yes @openai/codex exec -m gpt-5-codex "tools.call name=subagents.delegate arguments={\"agent\":\"$AGENT\",\"task\":\"test\"}" 2>&1)
echo "$DELEGATE_OUTPUT"
echo "$DELEGATE_OUTPUT" | grep -q '"ok": true'
