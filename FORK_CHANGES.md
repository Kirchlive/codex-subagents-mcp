# Fork Changes: codex-subagents-mcp

## 📋 Overview

This document describes all changes made in the fork [Kirchlive/codex-subagents-mcp](https://github.com/Kirchlive/codex-subagents-mcp) compared to the original repository [leonardsellem/codex-subagents-mcp](https://github.com/leonardsellem/codex-subagents-mcp).

## 🎯 Repository Purpose

**codex-subagents-mcp** is a TypeScript MCP (Model Context Protocol) server that provides specialized AI agents for software development tasks. Agents are defined as simple Markdown or JSON files and executed via the Codex CLI.

### Key Features
- **Auditable**: All agent personas live in `agents/*.md|json` files
- **Secure**: Token-based orchestration with isolated working directories
- **CLI-first**: Main tool `delegate` plus utilities (`list_agents`, `validate_agents`)
- **Extensible**: Easy addition of new agents as Markdown files

## 🔄 Fork-specific Changes

### Commits in Fork

The fork contains **2 specific commits** above the original repository:

#### 1. **CI Badge Update** (Commit: `1e48770`)
- **Change**: GitHub Actions badge points to fork repository
- **File**: `README.md`
- **Purpose**: Correct CI status display for fork

#### 2. **README & Setup Documentation** (Commit: `09834b6`)
- **Change**: Complete README overhaul
- **Files**: `README.md`, setup guides
- **Improvements**:
  - 50% more compact (153 vs 306 lines)
  - Clearer setup steps with OAuth flow
  - Fork features prominently highlighted
  - More practical integration examples

## 🏗️ Core Functionality (inherited from original)

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Codex CLI                               │
├─────────────────────────────────────────────────────────────────┤
│                    MCP Protocol Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  TinyMCPServer                                                 │
│  ├── Tools: delegate, delegate_batch, list_agents, validate    │
│  ├── JSON-RPC over stdio                                       │
│  └── Content-Length / Newline framing                          │
├─────────────────────────────────────────────────────────────────┤
│  Agent Registry & Loading                                      │
│  ├── Built-in: reviewer, debugger, security                    │
│  ├── Dynamic: agents/*.md, agents/*.json                       │
│  └── Frontmatter parsing + validation                          │
├─────────────────────────────────────────────────────────────────┤
│  Orchestration Layer                                           │
│  ├── Token gating (ORCHESTRATOR_TOKEN)                         │
│  ├── Request routing through orchestrator                      │
│  ├── Todo/Step tracking in orchestration/                      │
│  └── Envelope system for structured tasks                      │
├─────────────────────────────────────────────────────────────────┤
│  Execution Environment                                         │
│  ├── Temporary workdirs (mkdtemp)                              │
│  ├── Optional repo mirroring                                   │
│  ├── Sanitized environment variables                           │
│  └── Subprocess spawning (codex exec)                          │
└─────────────────────────────────────────────────────────────────┘
```

### Available Agents

#### Built-in Agents (hardcoded)
- **reviewer**: Senior code reviewer for clarity and maintainability
- **debugger**: Root-cause debugger for systematic error analysis
- **security**: Security auditor for OWASP and threat modeling

#### File-based Agents (agents/*.md|json)
| Agent | Purpose | Main Focus |
|-------|---------|------------|
| **a11y** | Accessibility | WCAG compliance, screen readers |
| **analytics** | Data Analysis | Metrics, A/B tests, conversion |
| **api** | API Design | REST/GraphQL, documentation |
| **coach** | Performance Coach | Mentoring, code reviews |
| **copy** | Content Writing | Marketing, documentation |
| **custdev** | Customer Development | User interviews, feedback |
| **devops** | DevOps | CI/CD, infrastructure |
| **docs** | Documentation | Technical docs, API docs |
| **git** | Git Workflow | Branching, merge conflicts |
| **ios** | iOS Development | Swift, UIKit, SwiftUI |
| **obsidian** | Knowledge Management | Vault organization |
| **orchestrator** | Task Orchestration | Agent coordination |
| **perf** | Performance | Profiling, optimization |
| **pricing** | Pricing Strategy | Monetization |
| **research** | Research | Market research, trends |
| **test** | Test Engineering | Unit/integration tests |
| **ux** | UX Design | User experience, usability |
| **web** | Web Development | Frontend, JavaScript |

## 📊 Key Technical Improvements (from previous merges)

### 1. Token System & Automatic Injection
```typescript
// src/orchestration.ts
const meta: Record<string, unknown> = {
  request_id,
  requested_agent: params.agent,
  // ...additional metadata
};
if (token) meta.token = token; // Automatic token injection
```

**Benefits**:
- Zero-config token management
- Secure agent routing
- No manual token configuration needed

### 2. Test Bypass Mechanism
```bash
# Run tests without Codex CLI
export SUBAGENTS_DISABLE_CODEX=1
npm test
```

**Features**:
- CI/CD-friendly tests
- Deterministic test suite
- No Codex CLI installation required for tests

### 3. OAuth-friendly E2E Flow
```bash
# scripts/e2e.sh uses existing auth tokens
AUTH_FILE=~/.codex/auth.json
if [[ -f "$AUTH_FILE" ]]; then
    echo "Using existing auth token"
fi
```

**Improvements**:
- Auth token reuse
- gpt-5-codex as default model
- Simplified authentication

### 4. Improved Error Handling
- **Type Safety**: `NodeJS.ErrnoException` instead of `any`
- **Robust Output**: `writeSync` with MCP framing fallback
- **Early Validation**: Agent existence before token routing

## 🚀 Production-ready Features

### Orchestration Workflow
1. **Client Request**: `subagents.delegate(agent="reviewer", task="Review code")`
2. **Token Check**: Automatic routing through orchestrator with token
3. **Agent Loading**: Built-in or dynamic from `agents/`
4. **Workdir Setup**: Isolated temporary directories
5. **Execution**: `codex exec --profile <profile> <task>`
6. **Tracking**: Todo/Steps in `orchestration/<request_id>/`
7. **Response**: stdout/stderr + working directory path

### Parallel Batch Processing
```javascript
// Execute multiple agents simultaneously
await subagents.delegate_batch([
  { agent: "test", task: "Write unit tests" },
  { agent: "docs", task: "Update documentation" },
  { agent: "security", task: "Security audit" }
]);
```

## 📦 Dependencies Updates

| Package | Original | Fork | Change |
|---------|----------|------|--------|
| vitest | 1.6.0 | 3.2.4 | Major upgrade for better performance |
| @openai/codex | 0.27.0 | 0.42.0 | New API features |

## 🔧 Configuration

### Codex CLI Setup (~/.codex/config.toml)
```toml
[[mcpServers]]
name = "subagents"
command = "node"
args = ["/path/to/dist/codex-subagents.mcp.js"]
```

### Environment Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `SUBAGENTS_DISABLE_CODEX` | Tests without Codex CLI | `0` |
| `ORCHESTRATOR_TOKEN` | Token for secure orchestration | (generated) |
| `SUBAGENTS_MIRROR_REPO` | Enable repository mirroring | `false` |

## 📚 Documentation Structure

### Core Documentation
- **README.md**: Main documentation (fork-optimized)
- **AGENTS.md**: Repository guidelines & developer docs
- **FORK_CHANGES.md**: This file

### Technical Documentation (docs/)
- **INTEGRATION.md**: Git worktree mirroring, deployment
- **OPERATIONS.md**: Logging, troubleshooting, orchestration
- **SECURITY.md**: Threat model & hardening
- **ORCHESTRATION.md**: Envelope format and token gating

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### End-to-End Tests
```bash
./scripts/e2e.sh
```

### CI/CD Integration
- GitHub Actions workflow for automated tests
- Badge status shows fork build status

## 🎯 Fork Advantages Summary

1. **Improved Documentation**: 50% more compact, more practical
2. **CI/CD Friendliness**: Tests possible without Codex CLI
3. **OAuth Support**: Simplified authentication
4. **Production Readiness**: Token management, error handling
5. **Developer Ergonomics**: Clearer setup steps

## 📝 Contributing

Contributions are welcome! Please note:
- Agent definitions in `agents/` as `.md` or `.json`
- Add tests for new features
- Update documentation
- Follow code style (TypeScript, ESLint)

## 📄 License

MIT License - see LICENSE file for details

---

*Last Updated: 2025-09-27*
*Fork: [Kirchlive/codex-subagents-mcp](https://github.com/Kirchlive/codex-subagents-mcp)*
*Original: [leonardsellem/codex-subagents-mcp](https://github.com/leonardsellem/codex-subagents-mcp)*