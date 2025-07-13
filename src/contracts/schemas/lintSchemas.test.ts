import { describe, test, expect } from 'vitest'
import { LintIssueSchema, LintDataSchema } from './lintSchemas'
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
        hasBlocked: true,
      }),
      expectedSuccess: true,
    },
    {
      description: 'without timestamp',
      lintData: testData.lintDataWithout(['timestamp']),
      expectedSuccess: false,
    },
    {
      description: 'without hasBlocked',
      lintData: testData.lintDataWithout(['hasBlocked']),
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
