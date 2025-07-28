# TDD Guard Pytest Reporter

Pytest plugin that captures test results for TDD Guard validation.

## Requirements

- Python 3.8+
- pytest 6.0+
- [TDD Guard](https://github.com/nizos/tdd-guard) installed globally

## Installation

```bash
pip install tdd-guard-pytest
```

The plugin activates automatically when installed.

## Configuration

### Project Root Configuration

Set `tdd_guard_project_root` to your project root using any ONE of these methods:

**Option 1: pyproject.toml**

```toml
[tool.pytest.ini_options]
tdd_guard_project_root = "/absolute/path/to/project/root"
```

**Option 2: pytest.ini**

```ini
[pytest]
tdd_guard_project_root = /absolute/path/to/project/root
```

**Option 3: setup.cfg**

```ini
[tool:pytest]
tdd_guard_project_root = /absolute/path/to/project/root
```

### Configuration Rules

- Path must be absolute
- Current directory must be within the configured project root
- Falls back to current directory if configuration is invalid

## More Information

- Test results are saved to `.claude/tdd-guard/data/test.json`
- See [TDD Guard documentation](https://github.com/nizos/tdd-guard) for complete setup

## License

MIT
