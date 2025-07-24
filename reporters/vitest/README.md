# tdd-guard-vitest

Vitest reporter for [TDD Guard](https://github.com/nizos/tdd-guard) - automated TDD enforcement for Claude Code.

## Installation

```bash
npm install --save-dev tdd-guard-vitest
```

## Usage

Add to your `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import { VitestReporter } from 'tdd-guard-vitest'

export default defineConfig({
  test: {
    reporters: ['default', new VitestReporter()],
  },
})
```

## Documentation

For complete setup and configuration instructions, see the [TDD Guard documentation](https://github.com/nizos/tdd-guard).

## License

MIT
