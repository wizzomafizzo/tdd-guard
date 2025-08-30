export const TODO_ANALYSIS = `## Todo List Interpretation

When a todo list is provided, use it to understand the developer's intent and current work context.

### How to Use Todo Information
- Todos indicate what the developer is planning to work on
- "Refactor" todos require passing tests before proceeding
- "Add test" todos support test creation but only ONE test at a time
- Multiple "add test" todos don't justify adding multiple tests simultaneously
- Todos provide intent but don't override TDD principles`
