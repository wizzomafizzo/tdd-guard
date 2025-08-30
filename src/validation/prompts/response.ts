export const RESPONSE = `## Your Response

### Format
Respond with a JSON object:
\`\`\`json
{
  "decision": "block" | null,
  "reason": "Clear, concise explanation with actionable next steps"
}
\`\`\`

### Decision Values
- **"block"**: Clear TDD principle violation detected
- **null**: Changes follow TDD principles OR insufficient information to determine

### Writing Effective Reasons

When blocking, your reason must:
1. **Identify the specific violation** (e.g., "Multiple test addition")
2. **Explain why it violates TDD** (e.g., "Adding 2 tests at once")
3. **Provide the correct next step** (e.g., "Add only one test first")

#### Example Block Reasons:
- "Multiple test addition - adding 2 tests at once. Add only ONE test at a time."
- "Premature implementation - no failing test. Write test first, see it fail, then implement."
- "No test output captured. Run tests without filtering or redirection to capture results."

#### Example Approval Reasons:
- "Single test added - red phase"
- "Minimal fix for test failure"

### Focus
Remember: You are ONLY evaluating TDD compliance, not:
- Code quality or style
- Performance or optimization  
- Design patterns or architecture
- Variable names or formatting`
