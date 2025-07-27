# TDD Guard Pytest Reporter

Pytest plugin that captures test results for TDD Guard validation.

## Requirements

- [TDD Guard](https://github.com/nizos/tdd-guard) must be installed
- Python 3.8+
- pytest 6.0+

## Installation

```bash
# First install TDD Guard
npm install -g tdd-guard

# Then install the pytest plugin
pip install tdd-guard-pytest
```

## Usage

The plugin automatically activates when installed. By default, it saves test results to `.claude/tdd-guard/data/test.json` in the current working directory.

## Configuration

### Monorepo Support

For monorepos or projects where tests are run from subdirectories, you can configure the project root directory where test results should be saved.

#### Using pyproject.toml

```toml
[tool.pytest.ini_options]
tdd_guard_project_root = "/absolute/path/to/project/root"
```

#### Using pytest.ini

```ini
[pytest]
tdd_guard_project_root = /absolute/path/to/project/root
```

#### Using setup.cfg

```ini
[tool:pytest]
tdd_guard_project_root = /absolute/path/to/project/root
```

#### Using tox.ini

```ini
[pytest]
tdd_guard_project_root = /absolute/path/to/project/root
```

### Configuration Rules

1. **Absolute paths only** - The path must be absolute (starts with `/` on Unix or `C:\` on Windows)
2. **Current directory validation** - The current working directory must be within the configured project root
3. **Fallback behavior** - If the configuration is invalid, the plugin falls back to saving in the current directory

### Example Monorepo Setup

```
my-monorepo/
├── pyproject.toml          # Contains: tdd_guard_project_root = "/path/to/my-monorepo"
├── packages/
│   ├── backend/
│   │   ├── tests/
│   │   └── pyproject.toml  # Inherits root configuration
│   └── frontend/
│       └── tests/
```

With this setup, running pytest from any subdirectory will save results to `/path/to/my-monorepo/.claude/tdd-guard/data/test.json`.

## How it Works

1. Captures test results during pytest execution
2. Saves results to `.claude/tdd-guard/data/test.json`
3. TDD Guard reads these results to validate TDD compliance

## License

MIT
