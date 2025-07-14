import { describe, test, expect } from 'vitest'
import {
  LintIssueSchema,
  LintDataSchema,
  ESLintMessageSchema,
  ESLintResultSchema,
} from './lintSchemas'
import { testData } from '@testUtils'

describe('LintIssueSchema', () => {
  test.each([
    {
      description: 'valid lint issue with all fields',
      issue: testData.lintIssue(),
      expectedSuccess: true,
    },
    {
      description: 'valid lint issue without optional rule',
      issue: testData.lintIssueWithout(['rule']),
      expectedSuccess: true,
    },
    {
      description: 'without file',
      issue: testData.lintIssueWithout(['file']),
      expectedSuccess: false,
    },
    {
      description: 'without line',
      issue: testData.lintIssueWithout(['line']),
      expectedSuccess: false,
    },
    {
      description: 'without column',
      issue: testData.lintIssueWithout(['column']),
      expectedSuccess: false,
    },
    {
      description: 'without severity',
      issue: testData.lintIssueWithout(['severity']),
      expectedSuccess: false,
    },
    {
      description: 'without message',
      issue: testData.lintIssueWithout(['message']),
      expectedSuccess: false,
    },
    {
      description: 'with invalid severity',
      issue: {
        ...testData.lintIssue(),
        severity: 'info',
      },
      expectedSuccess: false,
    },
  ])('$description', ({ issue, expectedSuccess }) => {
    const result = LintIssueSchema.safeParse(issue)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('LintDataSchema', () => {
  test.each([
    {
      description: 'valid lint data with no issues',
      lintData: testData.lintData({
        issues: [],
        errorCount: 0,
        warningCount: 0,
      }),
      expectedSuccess: true,
    },
    {
      description: 'valid lint data with issues',
      lintData: testData.lintData({
        hasNotifiedAboutLintIssues: true,
      }),
      expectedSuccess: true,
    },
    {
      description: 'without timestamp',
      lintData: testData.lintDataWithout(['timestamp']),
      expectedSuccess: false,
    },
    {
      description: 'without hasNotifiedAboutLintIssues',
      lintData: testData.lintDataWithout(['hasNotifiedAboutLintIssues']),
      expectedSuccess: false,
    },
    {
      description: 'without files',
      lintData: testData.lintDataWithout(['files']),
      expectedSuccess: false,
    },
    {
      description: 'without issues',
      lintData: testData.lintDataWithout(['issues']),
      expectedSuccess: false,
    },
    {
      description: 'without errorCount',
      lintData: testData.lintDataWithout(['errorCount']),
      expectedSuccess: false,
    },
    {
      description: 'without warningCount',
      lintData: testData.lintDataWithout(['warningCount']),
      expectedSuccess: false,
    },
  ])('$description', ({ lintData, expectedSuccess }) => {
    const result = LintDataSchema.safeParse(lintData)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('ESLintMessageSchema', () => {
  test.each([
    {
      description: 'valid ESLint message with all fields',
      message: testData.eslintMessage(),
      expectedSuccess: true,
    },
    {
      description: 'valid without optional line',
      message: testData.eslintMessageWithout(['line']),
      expectedSuccess: true,
    },
    {
      description: 'valid without optional column',
      message: testData.eslintMessageWithout(['column']),
      expectedSuccess: true,
    },
    {
      description: 'valid without optional ruleId',
      message: testData.eslintMessageWithout(['ruleId']),
      expectedSuccess: true,
    },
    {
      description: 'without required severity',
      message: testData.eslintMessageWithout(['severity']),
      expectedSuccess: false,
    },
    {
      description: 'without required message',
      message: testData.eslintMessageWithout(['message']),
      expectedSuccess: false,
    },
    {
      description: 'with invalid severity type',
      message: {
        ...testData.eslintMessage(),
        severity: 'error',
      },
      expectedSuccess: false,
    },
  ])('$description', ({ message, expectedSuccess }) => {
    const result = ESLintMessageSchema.safeParse(message)
    expect(result.success).toBe(expectedSuccess)
  })
})

describe('ESLintResultSchema', () => {
  test.each([
    {
      description: 'valid ESLint result with messages',
      result: testData.eslintResult(),
      expectedSuccess: true,
    },
    {
      description: 'valid without optional messages',
      result: testData.eslintResultWithout(['messages']),
      expectedSuccess: true,
    },
    {
      description: 'valid with empty messages array',
      result: testData.eslintResult({ messages: [] }),
      expectedSuccess: true,
    },
    {
      description: 'without required filePath',
      result: testData.eslintResultWithout(['filePath']),
      expectedSuccess: false,
    },
    {
      description: 'with invalid messages type',
      result: {
        ...testData.eslintResult(),
        messages: 'not-an-array',
      },
      expectedSuccess: false,
    },
  ])('$description', ({ result, expectedSuccess }) => {
    const parseResult = ESLintResultSchema.safeParse(result)
    expect(parseResult.success).toBe(expectedSuccess)
  })
})
