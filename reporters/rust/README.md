# TDD Guard Rust Reporter

Rust test reporter that captures test results for TDD Guard validation.

**Note:** This reporter is part of the [TDD Guard](https://github.com/nizos/tdd-guard) project, which ensures Claude Code follows Test-Driven Development principles.

## Requirements

- Rust 1.70+
- TDD Guard installed globally
- `cargo-nextest` (recommended) or `cargo test` with JSON output support

## Installation

### As Part of TDD Guard (Recommended)

Install TDD Guard globally to get all reporters including this Rust reporter:

```bash
npm install -g tdd-guard
```

### From Source

```bash
git clone https://github.com/nizos/tdd-guard.git
cd tdd-guard/reporters/rust
cargo install --path .
```

## Usage

The reporter works as a filter that processes test output while passing it through unchanged. When input is piped into the reporter, passthrough mode is enabled automatically. When invoked without piped input, it runs tests directly.

### With cargo-nextest (Recommended)

```bash
cargo nextest run 2>&1 | tdd-guard-rust --project-root /absolute/path/to/project
```

### With cargo test

```bash
cargo test -- -Z unstable-options --format json 2>&1 | tdd-guard-rust --project-root /absolute/path/to/project
```

### Direct Execution

The reporter can also execute tests directly:

```bash
# Auto-detect runner (prefers nextest)
tdd-guard-rust --project-root /absolute/path/to/project

# Force specific runner
tdd-guard-rust --project-root /absolute/path/to/project --runner nextest
tdd-guard-rust --project-root /absolute/path/to/project --runner cargo

# Pass arguments to test runner
tdd-guard-rust --project-root /absolute/path/to/project -- --lib --test integration_test
```

## Makefile Integration

Add to your `Makefile`:

```makefile
.PHONY: test
test:
	cargo nextest run 2>&1 | tdd-guard-rust --project-root $(PWD) --passthrough

.PHONY: test-tdd
test-tdd:
	tdd-guard on && $(MAKE) test
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run tests with TDD Guard
  run: |
    npm install -g tdd-guard
    cargo nextest run 2>&1 | tdd-guard-rust --project-root ${{ github.workspace }} --passthrough
```

## Flags and environment

- --passthrough: force passthrough mode even if stdin is a terminal.
- --no-auto-passthrough: disable implicit passthrough when stdin is piped.
- --runner [auto|nextest|cargo]: choose test runner for direct execution (default: auto).
- Environment: TDD_GUARD_AUTO_PASSTHROUGH=0|false|no|off disables implicit passthrough.

## Configuration

### Project Root

The `--project-root` flag must be an absolute path to your project directory. This is where the `.claude/tdd-guard/data/test.json` file will be written.

### Auto-detection

If not using `--passthrough` mode, the reporter will auto-detect the test runner:

1. Checks if `cargo-nextest` is available
2. Falls back to standard `cargo test` if not

## How It Works

1. **Capture**: Reads JSON-formatted test output from stdin or runs tests directly
2. **Pass-through**: Outputs unchanged test results to stdout
3. **Transform**: Converts test results to TDD Guard format
4. **Save**: Writes results to `.claude/tdd-guard/data/test.json`

This design ensures zero disruption to existing workflows while enabling TDD validation.

## Output Format

The reporter generates JSON in the following format:

```json
{
  "testModules": [
    {
      "moduleId": "my_crate",
      "tests": [
        {
          "name": "test_function",
          "fullName": "my_crate::tests::test_function",
          "state": "passed|failed|skipped",
          "errors": []
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Compilation Errors

The reporter detects and reports compilation errors as failed tests in the "compilation" module.

### Workspace Projects

For workspace projects with multiple crates, run tests from the workspace root:

```bash
cargo test --workspace -- -Z unstable-options --format json 2>&1 | \
  tdd-guard-rust --project-root $(PWD) --passthrough
```

### Missing JSON Output

If you see "no JSON output detected", ensure you're using the correct flags:

- For nextest: Set `NEXTEST_EXPERIMENTAL_LIBTEST_JSON=1`
- For cargo test: Use `-- -Z unstable-options --format json`

## License

MIT - See LICENSE file in the repository root.
