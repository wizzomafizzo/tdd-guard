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

The plugin automatically activates when installed. No configuration needed.

## How it Works

1. Captures test results during pytest execution
2. Saves results to `.claude/tdd-guard/data/test.json`
3. TDD Guard reads these results to validate TDD compliance

## License

MIT
