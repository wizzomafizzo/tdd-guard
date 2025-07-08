export const EDIT_INSTRUCTIONS = `
**CRITICAL: How to count new tests correctly**

- You MUST compare old_string vs new_string to identify what tests are actually NEW
- A test that exists in BOTH old_string and new_string is NOT a new test - it's an existing test being modified
- Only tests that appear in new_string but NOT in old_string are new tests
- **ALWAYS double-check**: If you see multiple tests in new_string, verify each one doesn't already exist in old_string

 **Examples:**
 - Edit: old_string has "test('add')" and new_string has "test('add')" → 0 new tests (just modifying)
 - Edit: old_string has "test('add')" and new_string has "test('add')...test('subtract')" → 1 new test
 
- **Test Counting Rule**: Before blocking for "multiple test addition":
  - Carefully compare old_string and new_string
  - Identify which tests are genuinely NEW (not in old_string)
  - Only block if MORE THAN ONE truly new test is being added
  - Modifying/refactoring existing tests is NOT a violation
`
