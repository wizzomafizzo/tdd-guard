# TDD Guard

[![npm version](https://badge.fury.io/js/tdd-guard.svg)](https://www.npmjs.com/package/tdd-guard)
[![PyPI version](https://badge.fury.io/py/tdd-guard.svg)](https://pypi.org/project/tdd-guard/)
[![CI](https://github.com/nizos/tdd-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/nizos/tdd-guard/actions/workflows/ci.yml)
[![Security](https://github.com/nizos/tdd-guard/actions/workflows/security.yml/badge.svg)](https://github.com/nizos/tdd-guard/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Automated TDD enforcement for Claude Code.

## Overview

TDD Guard monitors file operations in real-time and blocks any changes that violate TDD principles. By analyzing test results, todos, and code changes, it ensures Claude Code follows the red-green-refactor cycle without manual reminders.

<p align="center">
  <a href="https://nizar.se/uploads/videos/tdd-guard-demo.mp4">
    <img src="docs/assets/tdd-guard-demo-screenshot.gif" alt="TDD Guard Demo" width="600">
  </a>
  <br>
  <em>Click to watch TDD Guard in action</em>
</p>

## Why TDD Guard?

- **Focus on solving problems** - TDD Guard enforces the rules while you design solutions
- **Save context for what matters** - No more TDD instructions cluttering your CLAUDE.md
- **Works with your stack** - TypeScript, JavaScript, and Python today. More languages coming soon
- **Control without context switches** - Toggle with `tdd-guard on/off` mid-session
- **Flexible validation** - Use local Claude or configure Anthropic API

## Requirements

- Node.js 18+
- Test Runner:
  - JavaScript/TypeScript: Vitest
  - Python: pytest

## Installation

Install the TDD Guard CLI globally:

```bash
npm install -g tdd-guard
```

### Language-Specific Reporters

**JavaScript/TypeScript (Vitest)**

In your project, install the Vitest reporter:

```bash
npm install --save-dev @tdd-guard/vitest
```

**Python (pytest)**

Install the pytest reporter:

```bash
pip install tdd-guard
```

## Quick Start

Getting started is quick and simple:

### 1. Configure Claude Code Hook

Use the `/hooks` command in Claude Code:

1. Type `/hooks` in Claude Code
2. Select `PreToolUse - Before tool execution`
3. Choose `+ Add new matcher...`
4. Enter: `Write|Edit|MultiEdit|TodoWrite`
5. Select `+ Add new hook...`
6. Enter command: `tdd-guard`
7. Choose where to save (Project settings recommended)

**Tip:** Also configure [quick commands](docs/quick-commands.md) for `tdd-guard on/off` and [ESLint integration](docs/linting.md) for automated refactoring support.

### 2. Configure Test Reporter

TDD Guard captures test results from your test runner. Ensure your `package.json` or project scripts use the correct test command.

**JavaScript/TypeScript (Vitest)**

Add to `vitest.config.ts`:

```typescript
import { VitestReporter } from '@tdd-guard/vitest'

export default defineConfig({
  test: {
    reporters: ['default', new VitestReporter()],
  },
})
```

**Note:** Using workspaces or monorepos? See the [workspace configuration guide](docs/configuration.md#workspacemonorepo-configuration) for additional setup steps.

**Python (pytest)**

No configuration needed - the pytest plugin activates automatically when installed.

## Security Notice

As stated in the [Claude Code Hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks#security-considerations):

> Hooks execute shell commands with your full user permissions without confirmation. You are responsible for ensuring your hooks are safe and secure. Anthropic is not liable for any data loss or system damage resulting from hook usage.

We share this information for transparency. Please read the full [security considerations](https://docs.anthropic.com/en/docs/claude-code/hooks#security-considerations) before using hooks.

TDD Guard runs with your user permissions and has access to your file system. We follow security best practices including automated security scanning, dependency audits, and test-driven development. Review the source code if you have security concerns.

## Known Limitations

- Not tested with multiple subagents in the same project

## Roadmap

- Add support for more testing frameworks (Jest, Mocha, unittest, etc.)
- Add support for additional programming languages (Go, Rust, Java, etc.)
- Encourage meaningful refactoring opportunities when tests are green
- Add support for multiple concurrent subagents per project

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

**Contributors:**

- Python/pytest support: [@Durafen](https://github.com/Durafen)

## Learn More

- [Configuration Guide](docs/configuration.md) - Environment variables, model options, and troubleshooting
- [Architecture Decision Records](docs/adr/) - Technical design decisions and rationale

## License

[MIT](LICENSE)
