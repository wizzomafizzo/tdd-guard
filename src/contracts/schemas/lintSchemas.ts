import { z } from 'zod'

export const LintIssueSchema = z.object({
  file: z.string(),
  line: z.number(),
  column: z.number(),
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  rule: z.string().optional(),
})

export const LintDataSchema = z.object({
  timestamp: z.string(),
  files: z.array(z.string()),
  issues: z.array(LintIssueSchema),
  errorCount: z.number(),
  warningCount: z.number(),
  hasBlocked: z.boolean(),
})

export const ESLintMessageSchema = z.object({
  line: z.number().optional(),
  column: z.number().optional(),
  severity: z.number(),
  message: z.string(),
  ruleId: z.string().optional(),
})

export const ESLintResultSchema = z.object({
  filePath: z.string(),
  messages: z.array(ESLintMessageSchema).optional(),
})

export type LintIssue = z.infer<typeof LintIssueSchema>
export type LintData = z.infer<typeof LintDataSchema>
export type ESLintMessage = z.infer<typeof ESLintMessageSchema>
export type ESLintResult = z.infer<typeof ESLintResultSchema>
