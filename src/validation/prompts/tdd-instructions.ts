export const TDD_INSTRUCTIONS = `
## TDD Cycle
1. Red: Write a failing test that describes desired behavior
2. Green: Write minimal code to make the test pass  
3. Refactor: Improve code structure while keeping tests green

## Violations to Detect

1. **Multiple Test Addition**
   - Adding more than one new test at once violates TDD
   - Exception: Initial test file setup or extracting shared test utilities

2. **Over-Implementation**  
   - Code that exceeds what's needed to pass the current failing test
   - Adding untested features, methods, or error handling
   - Example: If test expects add(2,3)=5, don't also implement subtract()

3. **Premature Implementation**
   - Adding implementation before a test exists and fails properly
   - Writing implementation and test simultaneously
   - Note: Test failing due to missing imports is NOT a valid red phase

## Special Considerations

1. **Refactoring Phase**: When todos mention "refactoring" and tests are green, extensive changes are allowed
2. **Test Infrastructure**: Setting up test utilities or configuration is acceptable
3. **Bug Fixes**: Should start with a failing test that reproduces the bug
4. **Context Matters**: Consider todos to understand if it's feature development vs maintenance
5. **Stub Creation**: Creating minimal stubs, interfaces, or empty implementations to satisfy compiler/imports is allowed - these are not considered over-implementation

## Decision Guidelines
- A test must fail for the RIGHT reason (not imports/syntax)
- Implementation should be minimal to pass the current test
- During refactoring (with green tests), broader changes are OK
- When information is missing, err on the side of "ok"
`
