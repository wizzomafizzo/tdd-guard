# TDD Detective

## Project Goal

TDD Detective uses Claude Code hooks to intercept relevant operations and employ a separate model to judge whether they violate Test-Driven Development (TDD) principles. This aids the agent in adhering to TDD principles without cluttering instructions or context with repeated reminders about proper TDD practices.

Our strategy is to prototype and understand how hooks can be used for this purpose. We're creating scripts that log available information, parse content, and use a model with the right context engineering to effectively aid the agent.

## Claude Code Hooks Documentation

### Hooks Configuration

Hooks are configured in `.claude/settings.json` with the following structure:

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here"
          }
        ]
      }
    ]
  }
}
```

### Hook Events

1. **PreToolUse**: Runs before tool calls, can block execution
2. **PostToolUse**: Runs after tool completion
3. **Notification**: Triggered when Claude Code sends notifications
4. **Stop**: Runs when main agent finishes responding
5. **SubagentStop**: Runs when subagent (Task) finishes

### Hook Input

Hooks receive JSON input via stdin with:
- Common fields: `session_id`, `transcript_path`
- Event-specific data: `tool_name`, `tool_input`, `tool_response`

Example input structure:
```json
{
  "session_id": "uuid",
  "transcript_path": "/path/to/transcript.jsonl",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file",
    "content": "file content"
  }
}
```

### Hook Output

Hooks communicate back via exit codes and JSON output:

#### Exit Codes:
- 0: Success
- 2: Blocking error (prevents tool execution)
- Other: Non-blocking error

#### JSON Output for Decision Control:
```json
{
  "decision": "approve" | "block",
  "message": "Explanation for the decision"
}
```

### Security Best Practices

- Validate and sanitize all inputs
- Quote shell variables properly
- Block path traversal attempts
- Use absolute paths
- Avoid accessing sensitive files
- Remember: Hooks execute with full user permissions

### Execution Details

- 60-second default timeout
- Runs in current working directory
- Hooks execute in parallel
- Full user permissions without confirmation

## Claude Code CLI Reference

### Essential Commands

```bash
# Start interactive REPL
claude

# Query with initial prompt
claude "Write a function to calculate prime numbers"

# Print mode (non-interactive)
claude -p "Explain this code"

# Continue most recent conversation
claude -c

# Resume specific session
claude -r "<session-id>" "Continue working on the feature"

# Update Claude Code
claude update
```

### Important Flags

#### Programmatic Use
- `--print, -p`: Print response and exit (essential for hooks)
- `--output-format`: Specify output format (text | json | stream-json)
- `--max-turns`: Limit agentic turns in non-interactive mode

#### Advanced Options
- `--verbose`: Enable detailed logging
- `--model`: Set specific model (e.g., "sonnet", "opus")
- `--allowedTools/--disallowedTools`: Control tool permissions

### Piping and Scripting

```bash
# Pipe file content
cat code.js | claude -p "Review this code for TDD violations"

# JSON output for parsing
claude -p "Generate test cases" --output-format json

# Parse with jq
result=$(claude -p "Analyze code" --output-format json)
analysis=$(echo "$result" | jq -r '.result')
```

## Claude Code SDK

### Authentication

1. Create an Anthropic API key in the Anthropic Console
2. Set environment variable: `export ANTHROPIC_API_KEY="your-key"`

### TypeScript Usage

```typescript
import { query, type SDKMessage } from "@anthropic-ai/claude-code";

const messages: SDKMessage[] = [];

for await (const message of query({
  prompt: "Check if this follows TDD principles",
  abortController: new AbortController(),
  options: {
    maxTurns: 3,
    cwd: process.cwd(),
  }
})) {
  messages.push(message);
}

console.log(messages);
```

### Output Formats

1. **Text** (default): Plain response text
2. **JSON**: Structured response with metadata
3. **Stream-JSON**: Incremental message delivery

### Best Practices

- Use JSON output for programmatic parsing
- Implement proper error handling
- Set appropriate timeouts for long operations
- Use AbortController for cancellation support

### Parsing Responses with jq

```bash
# Extract specific fields
result=$(claude -p "Analyze TDD compliance" --output-format json)
verdict=$(echo "$result" | jq -r '.result')
cost=$(echo "$result" | jq -r '.cost_usd')
token_count=$(echo "$result" | jq -r '.token_count_prompt')

# Handle streaming JSON
claude -p "Review tests" --output-format stream-json | \
  jq -r 'select(.type == "text") | .text'
```

## Project-Specific Implementation Notes

### Current Hooks

1. **timestamp-logger.js**: Logs all Claude Code events with timestamps
2. **content-logger.js**: Captures content from Write, Edit, and MultiEdit operations
3. **mew-detector.js**: Example of using Claude CLI within hooks (prototype)

### TDD Detection Strategy

1. **Context Gathering**: Hooks collect relevant information about code changes
2. **Content Analysis**: Parse and structure the captured content
3. **Model Evaluation**: Use Claude to evaluate TDD compliance
4. **Feedback Loop**: Provide real-time guidance through hook responses

### Future Enhancements

- Implement blocking hooks for TDD violations
- Create a context engine for better TDD analysis
- Add metrics and reporting for TDD compliance
- Integrate with test runners to verify test-first approach