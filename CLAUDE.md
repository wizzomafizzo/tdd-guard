# TDD Guard

## Project Goal

TDD Guard is a Claude Code hook that enforces Test-Driven Development by intercepting file operations.
When Claude Code attempts to edit or write files, TDD Guard:

1. **Captures**: Intercepts Edit, MultiEdit, and Write operations
2. **Analyzes**: Examines test results, file paths, and code changes
3. **Validates**: Checks TDD compliance using an AI model
4. **Blocks**: Prevents operations that skip tests or over-implement
5. **Guides**: Explains violations and suggests corrections

This automated enforcement maintains code quality without cluttering prompts with TDD reminders.

## Development Workflow

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

Example: `feat: add network request filtering to reduce noise in captured data` (explains why, not just what)

## Project Structure

The codebase is organized as a monorepo using npm workspaces, with modular packages and language-specific reporters:

```
packages/                         # Core functionality as npm workspaces
├── contracts/                    # @tdd-guard/contracts - Types and Zod schemas
├── config/                       # @tdd-guard/config - Configuration management
└── storage/                      # @tdd-guard/storage - Storage abstractions

reporters/                        # Language-specific test reporters
├── vitest/                       # @tdd-guard/vitest - Vitest reporter (npm)
└── pytest/                       # tdd-guard-pytest - Pytest reporter (pip)

src/                              # Main CLI application
├── cli/                          # Hook entry point and context builder
├── guard/                        # Guard enable/disable management
├── hooks/                        # Claude Code hook parsing and processing
├── linters/                      # ESLint integration for code quality
├── processors/                   # Test result and lint processing
├── providers/                    # Model and linter client factories
├── validation/                   # TDD principle validation
│   ├── validator.ts              # Sends context to AI model and parses response
│   ├── context/                  # Formats operations for AI validation
│   ├── prompts/                  # TDD validation rules and AI instructions
│   └── models/                   # Claude CLI and Anthropic API clients
└── index.ts                      # Package entry point

test/
├── integration/                  # End-to-end validation scenario tests
└── utils/                        # Test factories and helper utilities

docs/
├── adr/                          # Architecture Decision Records
└── CONFIGURATION.md              # Detailed configuration guide
```

### Monorepo Architecture

TDD Guard uses npm workspaces to separate concerns:

- **packages/**: Core functionality (@tdd-guard/contracts, config, storage)
- **reporters/**: Language-specific test reporters (vitest, pytest)
- **src/**: Main CLI application

Dependencies between workspaces are managed automatically.

### Testing

#### Guidelines

- **Use test helpers**: Extract setup logic into helper functions placed at the bottom of test files
- **Use test factories**: Always use factories from `test/utils/` instead of creating data inline
- **Group tests effectively**: Use `describe` blocks and `beforeEach` for common setup
- **Keep tests concise**: Keep as little logic in the tests themselves as possible

#### Commands

```bash
npm run build             # Build all workspaces and main package
npm run test              # All unit tests and base integration tests
npm run test:unit         # Fast unit tests only
npm run test:integration  # Slow integration tests (run after major prompt changes)
npm run lint              # Check code style and quality
npm run format            # Auto-format code with Prettier
npm run checks            # Run all checks: typecheck, lint, format, and test
```

### Key Design Principles

- **Interface-driven**: Core functionality defined by interfaces (`Storage`, `ModelClient`)
- **Dependency injection**: Components receive dependencies as parameters
- **Single responsibility**: Each module has one clear purpose
- **Type safety**: Comprehensive TypeScript types with runtime validation
