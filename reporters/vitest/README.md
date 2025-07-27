# TDD Guard Vitest Reporter

Vitest reporter that captures test results for TDD Guard validation.

## Requirements

- Node.js 18+
- Vitest 3.2.0+
- [TDD Guard](https://github.com/nizos/tdd-guard) installed globally

## Installation

```bash
npm install --save-dev tdd-guard-vitest
```

## Configuration

TDD Guard needs consistent test result locations. Two configurations ensure this:

1. **Environment variable** - Keeps Claude Code in the project root
2. **Vitest config** - Tells the reporter where to save results

### Environment Setup

Set Claude Code to maintain the project root:

```bash
# In ~/.zshrc or ~/.bashrc
export CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1
```

This returns Claude Code to the project root after each command. See [environment variables documentation](https://docs.anthropic.com/en/docs/claude-code/settings#environment-variables) for details.

Restart your terminal or run `source ~/.zshrc` after adding.

### Vitest Configuration

Add the reporter to your `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import { VitestReporter } from 'tdd-guard-vitest'

export default defineConfig({
  test: {
    reporters: ['default', new VitestReporter()],
  },
})
```

### Workspace/Monorepo Configuration

For workspaces or monorepos, pass the project root path to the reporter:

```typescript
// vitest.config.ts in project root
import { defineConfig } from 'vitest/config'
import { VitestReporter } from 'tdd-guard-vitest'
import path from 'path'

export default defineConfig({
  test: {
    reporters: ['default', new VitestReporter(path.resolve(__dirname))],
  },
})
```

If your vitest config is in a workspace subdirectory, pass the absolute path to your project root:

```typescript
new VitestReporter('/Users/username/projects/my-app')
```

## More Information

- Test results are saved to `.claude/tdd-guard/data/test.json`
- See [TDD Guard documentation](https://github.com/nizos/tdd-guard) for complete setup

## License

MIT
