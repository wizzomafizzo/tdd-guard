# TDD Detective

## Project Goal

TDD Detective uses Claude Code hooks to intercept relevant operations and employ a separate model to judge whether they violate Test-Driven Development (TDD) principles.
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
