import { z } from 'zod'

export const LintIssueSchema = z.object({
  file: z.string(),
  line: z.number(),
  column: z.number(),
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  rule: z.string().optional(),
})

export type LintIssue = z.infer<typeof LintIssueSchema>

export const LintDataSchema = z.object({
  timestamp: z.string(),
  files: z.array(z.string()),
  issues: z.array(LintIssueSchema),
  errorCount: z.number(),
  warningCount: z.number(),
  hasBlocked: z.boolean(),
})

export type LintData = z.infer<typeof LintDataSchema>
