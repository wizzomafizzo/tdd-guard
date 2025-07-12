# TDD Guard

[![npm version](https://badge.fury.io/js/tdd-guard.svg)](https://www.npmjs.com/package/tdd-guard)
[![CI](https://github.com/nizos/tdd-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/nizos/tdd-guard/actions/workflows/ci.yml)
[![Security](https://github.com/nizos/tdd-guard/actions/workflows/security.yml/badge.svg)](https://github.com/nizos/tdd-guard/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

TDD enforcement for Claude Code.

## Overview

TDD Guard monitors file operations in real-time and blocks changes that violate TDD principles. It provides immediate feedback when violations occur, helping maintain disciplined development practices without manual oversight.

The tool intercepts Write, Edit, and MultiEdit operations before execution, examining them against the current development state. Each validation considers the file path, intended modifications, current todo list, and latest test results to determine whether changes follow proper TDD practices.

## Core Benefits

- **Eliminates manual TDD enforcement**: No need to remind agents about writing tests first or following TDD cycles
- **Preserves context window**: Removes lengthy TDD instructions from `CLAUDE.md`, freeing space for domain-specific guidance
- **Maintains development flow**: Works silently until a violation occurs, then provides clear corrective feedback

## Technical Features

- **Multi-model Support**: Choose between Claude Code CLI or Anthropic API
- **Context Aggregation**: Combines file modifications, todo states, and test results for accurate validation
- **Dynamic Instructions**: Tailored prompts for Write, Edit, and MultiEdit operations

## Installation

```bash
npm install --save-dev tdd-guard
```

## Configuration

### 1. Environment Setup

Create a `.env` file:

```bash
# Model selection (claude_cli or anthropic_api)
MODEL_TYPE=claude_cli

# For Anthropic API:
# MODEL_TYPE=anthropic_api
# TDD_GUARD_ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Hook Configuration

#### Option A: Interactive Setup (Recommended)

Use Claude Code's `/hooks` command:

1. Type `/hooks` in Claude Code
2. Select `PreToolUse - Before tool execution`
3. Choose `+ Add new matcher...`
4. Enter: `Write|Edit|MultiEdit|TodoWrite`
5. Select `+ Add new hook...`
6. Enter command: `tdd-guard`
7. Choose where to save (Project settings recommended)

#### Option B: Manual Configuration

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit|TodoWrite",
        "hooks": [
          {
            "type": "command",
            "command": "tdd-guard"
          }
        ]
      }
    ]
  }
}
```

### 3. Test Reporter Setup

For Vitest projects, add to `vitest.config.ts`:

```typescript
import 'dotenv/config' // Load environment variables
import { VitestReporter } from 'tdd-guard'

export default defineConfig({
  test: {
    reporters: ['default', new VitestReporter()],
  },
})
```

## Security Notice

As stated in the [Claude Code Hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks#security-considerations):

> Hooks execute shell commands with your full user permissions without confirmation. You are responsible for ensuring your hooks are safe and secure. Anthropic is not liable for any data loss or system damage resulting from hook usage.

We share this information for transparency. Please read the full [security considerations](https://docs.anthropic.com/en/docs/claude-code/hooks#security-considerations) before using hooks.

TDD Guard runs with your user permissions and has access to your file system. We follow security best practices including automated security scanning, dependency audits, and test-driven development. Review the source code if you have security concerns.

## Known Limitations

- Not tested with multiple subagents working simultaneously
- Test output context only available for Vitest

## Roadmap

- Encourage meaningful refactoring opportunities when tests are green
- Add support for other testing frameworks (Jest, Mocha, etc.)
- Improve handling of concurrent subagents

## Contributing

Contributions are welcome. Feel free to submit issues and pull requests.

## Documentation

- [Configuration Guide](docs/CONFIGURATION.md)
- [Architecture Decision Records](docs/adr/)

## License

[MIT](LICENSE)
