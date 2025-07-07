# TDD Guard

## Project Goal

TDD Guard uses Claude Code hooks to intercept relevant operations and employ a separate model to judge whether they violate Test-Driven Development (TDD) principles.
This aids the agent in adhering to TDD principles without cluttering instructions or context with repeated reminders about proper TDD practices.

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
│   │   └── TDDValidation.ts      # Validation result structure (approve/block)
│   └── schemas/                  # Runtime data validation
│       └── hookData.ts           # Zod schemas for parsing Claude Code hooks
│
├── hooks/                        # Hook data extraction and processing
│   ├── HookEvents.ts             # Extracts content from tool inputs (Edit, Write, Todo)
│   └── processHookData.ts        # Orchestrates hook parsing and validation flow
│
├── validation/                   # TDD principle validation
│   ├── tddValidator.ts           # Sends context to AI model and parses response
│   ├── models/                   # AI model implementations
│   │   └── ClaudeModelClient.ts  # Executes Claude CLI for validation
│   └── prompts/                  # AI model instructions
│       └── system-prompt.ts      # Detailed TDD Guard rules and guidelines
│
├── storage/                      # Data persistence layer
│   ├── Storage.ts                # Abstract interface for storage operations
│   ├── FileStorage.ts            # Persists to edit.txt, todo.txt, test.txt files
│   └── MemoryStorage.ts          # In-memory Map storage for testing
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
