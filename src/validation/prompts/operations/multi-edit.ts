export const MULTI_EDIT = `## MultiEdit Operation

Multiple sequential edits to the same file. Each edit builds on the previous one - evaluate the cumulative effect across all edits.

### Key Points
- Process edits in order (each depends on previous)
- Count total new tests across ALL edits combined
- Check if implementation matches test requirements at each step

## Changes to Review
`
