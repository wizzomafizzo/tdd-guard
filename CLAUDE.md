# TDD Guard

## Project Goal

TDD Guard uses Claude Code hooks to intercept relevant operations and employ a separate model to judge whether they violate Test-Driven Development (TDD) principles.
This aids the agent in adhering to TDD principles without cluttering instructions or context with repeated reminders about proper TDD practices.

## Configuration

TDD Guard uses environment variables for configuration. Copy `.env.example` to `.env` and configure as needed:

- `USE_LOCAL_CLAUDE`: Set to `true` to use Claude from `~/.claude/local/claude`, or `false` to use system Claude (defaults to `false`)
- `ANTHROPIC_API_KEY`: API key for AnthropicModelClient. Get your key from https://console.anthropic.com/

## Development Workflow

### TDD Process

1. **Start with behavior**: Define what the system should do, not how
2. **Write failing test**: Create test that describes desired behavior
3. **Minimal implementation**: Write just enough code to pass the test
4. **Refactor if valuable**: Improve code structure while keeping tests green
5. **Iterate**: Repeat cycle for next behavior

### Pre-commit Hooks

The project uses husky and lint-staged to ensure code quality before commits:

- **Automatic formatting**: Prettier formats all staged files
- **Linting**: ESLint checks and fixes TypeScript files
- **Commit message validation**: Enforces conventional commit format

### Commit Guidelines

- **Atomic commits**: Each commit represents one logical change with its tests
- **Test and implementation together**: Never separate tests from the code they test
- **Explain why, not what**: Commit messages should explain the reason for the change
- **Conventional format**: Use prefixes to categorize changes: feat, fix, refactor, test, chore, docs

**Good commit message**: `feat: add network request filtering to reduce noise in captured data`  
**Poor commit message**: `feat: add filter function to requests.ts`

The message should help future developers understand why this change was necessary, not just describe what files were modified.
Aim for clarity and helpfulness while being concise.

## Project Structure

The codebase follows a clean, modular architecture organized by domain and responsibility:

```
src/
├── cli/                          # Command-line interface and entry points
│   ├── tdd-guard.ts              # Main CLI executable - receives hooks from Claude Code
│   └── buildContext.ts           # Aggregates stored data into validation context
│
├── contracts/                    # Shared contracts and data definitions
│   ├── types/                    # TypeScript interfaces and types
│   │   ├── Context.ts            # Data structure passed to model for validation
│   │   ├── ModelClient.ts        # Interface for AI model implementations
│   │   └── ValidationResult.ts      # Validation result structure (approve/block)
│   └── schemas/                  # Runtime data validation
│       └── toolSchemas.ts        # Tool operations with discriminated unions
│
├── hooks/                        # Hook data extraction and processing
│   ├── HookEvents.ts             # Processes and persists tool operations
│   └── processHookData.ts        # Orchestrates hook parsing and validation flow
│
├── validation/                   # TDD principle validation
│   ├── validator.ts           # Sends context to AI model and parses response
│   ├── context/                  # Context engineering and formatting
│   │   └── context.ts            # Formats operation data for model validation
│   ├── prompts/                  # Modular prompt system
│   │   └── ...                   # Operation-specific instructions and prompts
│   └── models/                   # AI model implementations
│       ├── ClaudeCli.ts  # Executes Claude CLI for validation
│       └── AnthropicModelClient.ts # Uses Anthropic API for validation
│
├── storage/                      # Data persistence layer
│   ├── Storage.ts                # Abstract interface for storage operations
│   ├── FileStorage.ts            # Persists context data to files
│   └── MemoryStorage.ts          # In-memory Map storage for testing
│
├── test/                         # Test utilities and factories
│   ├── index.ts                  # Unified export for all test factories
│   └── factories/                # Test data creation utilities
│       └── ...                   # Various operation factories and helpers
│
└── reporters/                    # Test output capture
    └── FileReporter.ts           # Vitest reporter that captures test results to file
```

### Key Design Principles

- **Interface-driven**: Core functionality defined by interfaces (`Storage`, `ModelClient`)
- **Dependency injection**: Components receive dependencies as parameters
- **Single responsibility**: Each module has one clear purpose
- **Test coverage**: Every implementation has corresponding tests
- **Type safety**: Comprehensive TypeScript types with runtime validation

### Architecture Decision Records

Important architectural decisions are documented in `docs/adr/`. These records explain the context, decision, and consequences of significant design choices.
