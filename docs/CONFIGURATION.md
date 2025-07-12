# Configuration Guide

This guide covers the configuration options for TDD Guard.

## Environment Variables

TDD Guard uses environment variables for configuration.
Create a `.env` file in your project root:

```bash
# Model selection for TDD validation
# Options: 'claude_cli' (default) or 'anthropic_api'
MODEL_TYPE=claude_cli

# Override model type for integration tests (optional)
# If not set, uses MODEL_TYPE value
# TEST_MODEL_TYPE=anthropic_api

# Use local Claude installation (true/false)
# Only applies when using 'claude_cli' model type
# Set to 'true' to use Claude from ~/.claude/local/claude
# Set to 'false' to use system Claude (claude in PATH)
USE_LOCAL_CLAUDE=false

# Anthropic API Key
# Required when MODEL_TYPE or TEST_MODEL_TYPE is set to 'anthropic_api'
# Get your API key from https://console.anthropic.com/
TDD_GUARD_ANTHROPIC_API_KEY=your-api-key-here
```

## Model Configuration

### Claude CLI

The default model uses the Claude Code command-line interface:

- **System Claude**: Set `USE_LOCAL_CLAUDE=false` to use Claude from your PATH
- **Local Claude**: Set `USE_LOCAL_CLAUDE=true` to use Claude from `~/.claude/local/claude`

### Anthropic API

For consistent cloud-based validation:

- Requires valid `TDD_GUARD_ANTHROPIC_API_KEY`

### Test-specific Configuration

You can use different models for tests and production:

```bash
MODEL_TYPE=claude_cli          # Production uses CLI
TEST_MODEL_TYPE=anthropic_api  # Tests use API
```

This is useful for:

- Running faster integration tests with API
- Avoiding local Claude dependencies in CI

## Hook Configuration

### Interactive Setup (Recommended)

Use Claude Code's `/hooks` command:

1. Type `/hooks` in Claude Code
2. Select `PreToolUse - Before tool execution`
3. Choose `+ Add new matcher...`
4. Enter: `Write|Edit|MultiEdit|TodoWrite`
5. Select `+ Add new hook...`
6. Enter command: `tdd-guard`
7. Choose where to save:
   - **Project settings** (`.claude/settings.json`) - Recommended for team consistency
   - **Local settings** (`.claude/settings.local.json`) - For personal preferences
   - **User settings** (`~/.claude/settings.json`) - For global configuration

### Manual Configuration

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

## Test Reporter Configuration

### Vitest

In `vitest.config.ts`:

```typescript
import 'dotenv/config' // Load environment variables
import { defineConfig } from 'vitest/config'
import { VitestReporter } from 'tdd-guard'

export default defineConfig({
  test: {
    reporters: ['default', new VitestReporter()],
  },
})
```

## Data Storage

TDD Guard stores context data in `.claude/tdd-guard-data/`:

- `operations/` - Individual operation data
- `test-output.json` - Latest test results
- `todo-context.json` - Current todo state

This directory is created automatically and should be added to `.gitignore`.

## Advanced Configuration

### Custom Validation Rules

To modify TDD validation behavior, fork the repository and edit the prompt files in `src/validation/prompts/`. Key files:

- `tdd-core-principles.ts` - Core TDD rules
- `write-analysis.ts` - Rules for Write operations
- `edit-analysis.ts` - Rules for Edit operations
- `multi-edit-analysis.ts` - Rules for MultiEdit operations
