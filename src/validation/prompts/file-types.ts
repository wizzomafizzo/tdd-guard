export const FILE_TYPES = `## File Type Specific Rules

### Identifying File Types

Identify whether this is a test file or implementation file by examining:

1. **File path patterns** (common across languages):
   - Test indicators: \`.test.\`, \`.spec.\`, \`_test.\`, \`test/\`, \`tests/\`, \`__tests__/\`
   - Example: \`calculator.test.js\`, \`main_test.go\`, \`test_helper.rb\`

2. **File content patterns** (when path is ambiguous):
   - Test declarations: \`test(\`, \`it(\`, \`describe(\`, \`#[test]\`, \`def test_\`, \`TEST_F\`, etc.
   - Test imports/frameworks: testing libraries, assertion methods
   
3. **Implementation files**: 
   - All other source files that contain business logic, not tests
   - Note: Some languages mix tests with implementation (e.g., Rust modules) - examine content carefully
`
