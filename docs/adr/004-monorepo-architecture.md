# ADR-004: Monorepo Architecture for Multi-Language Support

## Status

Accepted

## Context

TDD Guard needed to support multiple test frameworks across different programming languages. The original architecture had all code in a single package with language-specific reporters mixed together in the src directory.

This presented several challenges:

- **Language mixing** - JavaScript and Python code coexisted in src/reporters
- **Publishing complexity** - Different package managers (npm, pip) from one codebase
- **Contribution barriers** - Adding new reporters required understanding the entire codebase

We considered several approaches:

1. **Keep monolithic structure** - Continue with mixed languages in one package
2. **Separate repositories** - Create individual repos for each reporter
3. **Monorepo with workspaces** - Use npm workspaces for modular packages

## Decision

We will restructure TDD Guard as a monorepo using npm workspaces, with shared functionality extracted into internal packages and language-specific reporters in dedicated directories.

The implementation follows this structure:

```
packages/                    # Internal npm workspace packages
├── @tdd-guard/contracts    # Types and validation schemas
├── @tdd-guard/config       # Configuration management
└── @tdd-guard/storage      # Storage abstractions

reporters/                   # Language-specific test reporters
├── vitest/                 # tdd-guard-vitest (npm)
└── pytest/                 # tdd-guard-pytest (pip)

src/                        # Main CLI application
```

Key architectural decisions:

- **Internal packages use scoped names** (@tdd-guard/\*) with `"private": true`
- **Public packages use flat names** (tdd-guard, tdd-guard-vitest, tdd-guard-pytest)
- **Reporters are self-contained** with their own tests and build systems
- **TypeScript composite builds** for faster incremental compilation
- **Clear dependency hierarchy** - reporters depend on packages, not vice versa

## Consequences

### Positive

- **Language isolation** - Each reporter is contained in its own directory with appropriate tooling
- **Independent versioning** - Reporters can be released separately
- **Cleaner dependencies** - JavaScript packages don't include Python files
- **Easier contributions** - Add reporters without understanding core logic

### Negative

- **Increased complexity** - Multiple package.json files to maintain
- **Build orchestration** - Must build workspaces in correct order
- **Initial setup burden** - Contributors need to understand workspace structure
- **Documentation overhead** - Multiple README files and install instructions

### Neutral

- Users must install reporters separately from the CLI tool
- Internal packages remain in the repository but aren't published
