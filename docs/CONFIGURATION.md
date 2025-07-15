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

# Use system Claude installation
# Only applies when using 'claude_cli' model type
# Set to 'true' to use the system Claude (claude in PATH)
# Set to 'false' to use the Claude from ~/.claude/local/claude
USE_SYSTEM_CLAUDE=false

# Anthropic API Key
# Required when MODEL_TYPE or TEST_MODEL_TYPE is set to 'anthropic_api'
# Get your API key from https://console.anthropic.com/
TDD_GUARD_ANTHROPIC_API_KEY=your-api-key-here
```

## Model Configuration

### Claude CLI

The default model uses the Claude Code command-line interface:

- **System Claude**: Set `USE_SYSTEM_CLAUDE=true` to use Claude from your PATH
- **Local Claude**: Set `USE_SYSTEM_CLAUDE=false` to use Claude from `~/.claude/local/claude`

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

First, ensure Vitest is installed in your project:

```bash
npm install --save-dev vitest
```

Then configure it in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import { VitestReporter } from 'tdd-guard'

export default defineConfig({
  test: {
    reporters: ['default', new VitestReporter()],
  },
})
```

### ESLint

For refactoring phase support, install ESLint in your project:

```bash
npm install --save-dev eslint
```

TDD Guard uses ESLint to check for code issues during the refactoring phase.
Having the latest version ensures the lint results are provided in the format that tdd-guard expects.

### NPM Scripts

Ensure your `package.json` has a `test` script that runs Vitest:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

## Data Storage

TDD Guard stores context data in `.claude/tdd-guard-data/`:

- `operations/` - Individual operation data
- `test-output.json` - Latest test results
- `todo-context.json` - Current todo state

This directory is created automatically and should be added to `.gitignore`.

## Troubleshooting

### Claude CLI Issues

#### Finding Your Claude Installation

To determine which Claude installation you're using:

```bash
# Check global Claude
which claude

# Check local Claude
ls ~/.claude/local/claude
```

#### Testing Claude CLI

Test if Claude is working correctly:

```bash
# For system Claude
claude -p "which directory are we in?"

# For local Claude
~/.claude/local/claude -p "which directory are we in?"
```

#### API Key Conflicts

When using Claude CLI (not the API), ensure no `ANTHROPIC_API_KEY` environment variable is set. The Claude binary may attempt to use this key instead of your authenticated session:

```bash
# Check if API key is set
echo $ANTHROPIC_API_KEY

# Temporarily unset it
unset ANTHROPIC_API_KEY
```

### Dependency Versions

#### ESLint

Install the latest ESLint for better refactoring support during green phases:

```bash
npm install --save-dev eslint@latest
```

#### Vitest

Use the latest Vitest version to ensure correct test output format for TDD Guard:

```bash
npm install --save-dev vitest@latest
```

### Common Issues

1. **TDD Guard not triggering**: Check that hooks are properly configured in `.claude/settings.json`
2. **Test results not captured**: Ensure `VitestReporter` is added to your Vitest config
3. **Claude CLI failures**: Verify Claude installation and check for API key conflicts
4. **"Command not found" errors**: Make sure `tdd-guard` is installed as a dev dependency
5. **Changes not taking effect**: Restart your Claude session after modifying hooks or environment variables

## Advanced Configuration

### Custom Validation Rules

To modify TDD validation behavior, fork the repository and edit the prompt files in `src/validation/prompts/`. Key files:

- `tdd-core-principles.ts` - Core TDD rules
- `write-analysis.ts` - Rules for Write operations
- `edit-analysis.ts` - Rules for Edit operations
- `multi-edit-analysis.ts` - Rules for MultiEdit operations
