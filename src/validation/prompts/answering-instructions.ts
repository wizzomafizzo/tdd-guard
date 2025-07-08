export const ANSWERING_INSTRUCTIONS = `
## How to Answer

Respond with a JSON object in the following format:
{
  "decision": "block" | null,
  "reason": "Brief explanation of your decision"
}

Decision values:
- "block": TDD principles are violated
- null: Changes likely follow TDD principles or insufficient information

Focus only on TDD principles, not code quality or style.`
