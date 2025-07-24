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

# Linter type for refactoring phase support (optional)
# Options: 'eslint' or unset (no linting)
# See docs/linting.md for detailed setup and configuration
LINTER_TYPE=eslint
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

Use Claude Code's `/hooks` command to set up both hooks:

#### PreToolUse Hook (TDD Validation)

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

**Tip:** Also configure [quick commands](quick-commands.md) for `tdd-guard on/off` and [ESLint integration](linting.md) for automated refactoring support.

## Test Reporter Configuration

### JavaScript/TypeScript (Vitest)

First, ensure Vitest is installed in your project:

```bash
npm install --save-dev @tdd-guard/vitest
```

Then configure it in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import { VitestReporter } from '@tdd-guard/vitest'

export default defineConfig({
  test: {
    reporters: ['default', new VitestReporter()],
  },
})
```

Ensure your `package.json` has a `test` script:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

#### Workspace/Monorepo Configuration

Projects with workspaces or monorepos require additional configuration to ensure TDD Guard finds test results in the correct location.

**The problem:** When running tests from a workspace package with its own `package.json`, the working directory changes to that package's directory. This causes test results to be written to the workspace's `.claude` directory instead of the root, where TDD Guard expects to find them.

**Solution:**

1. Set Claude Code to maintain the project root directory:

```bash
# In ~/.zshrc or ~/.bashrc
export CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1
```

This returns Claude Code to the project root after each command. See [environment variables documentation](https://docs.anthropic.com/en/docs/claude-code/settings#environment-variables) for details.

Remember to restart your terminal or run `source ~/.zshrc` after adding.

2. Configure VitestReporter with the project root path:

```typescript
// vitest.config.ts in project root
import { defineConfig } from 'vitest/config'
import { VitestReporter } from '@tdd-guard/vitest'
import path from 'path'

export default defineConfig({
  test: {
    reporters: ['default', new VitestReporter(path.resolve(__dirname))],
  },
})
```

If your vitest config is in a workspace subdirectory, pass the absolute path to your project root instead: `new VitestReporter('/Users/username/projects/my-app')`.

### Python (pytest)

The TDD Guard pytest plugin is automatically discovered when the package is installed. No additional configuration is needed.

Simply run your tests as usual:

```bash
pytest
```

## Data Storage

TDD Guard stores context data in `.claude/tdd-guard/data/`:

- `test.json` - Latest test results from your test runner (Vitest or pytest)
- `todos.json` - Current todo state
- `modifications.json` - File modification history
- `lint.json` - ESLint results (only created when LINTER_TYPE=eslint)

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

#### Vitest

Use the latest Vitest version to ensure correct test output format for TDD Guard:

```bash
npm install --save-dev vitest@latest
```

#### pytest

For Python projects, ensure you have a recent version of pytest:

```bash
pip install pytest>=7.0.0
```

### Common Issues

1. **TDD Guard not triggering**: Check that hooks are properly configured in `.claude/settings.json`
2. **Test results not captured**: Ensure `VitestReporter` is added to your Vitest config
3. **Claude CLI failures**: Verify Claude installation and check for API key conflicts
4. **"Command not found" errors**: Make sure `tdd-guard` is installed globally with `npm install -g tdd-guard`
5. **Changes not taking effect**: Restart your Claude session after modifying hooks or environment variables

### Updating TDD Guard

To update to the latest version:

```bash
# Update CLI tool
npm update -g tdd-guard

# For JavaScript/TypeScript projects, update the Vitest reporter in your project
npm update @tdd-guard/vitest

# For Python projects, update the pytest reporter
pip install --upgrade tdd-guard-pytest
```

Check your current version:

```bash
npm list -g tdd-guard
pip show tdd-guard-pytest
```

## Advanced Configuration

### Custom Validation Rules

To modify TDD validation behavior, fork the repository and edit the prompt files in `src/validation/prompts/`. Key files:

- `tdd-core-principles.ts` - Core TDD rules
- `write-analysis.ts` - Rules for Write operations
- `edit-analysis.ts` - Rules for Edit operations
- `multi-edit-analysis.ts` - Rules for MultiEdit operations
