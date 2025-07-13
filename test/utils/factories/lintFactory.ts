/**
 * Factory functions for creating Lint test data
 */

import type {
  LintIssue,
  LintData,
} from '../../../src/contracts/schemas/lintSchemas'
import { omit } from './helpers'

/**
 * Creates a single lint issue object
 * @param params - Optional parameters for the lint issue
 */
export const lintIssue = (params?: Partial<LintIssue>): LintIssue => {
  const defaults: LintIssue = {
    file: '/src/example.ts',
    line: 15,
    column: 5,
    severity: 'error',
    message: 'Function has too high complexity',
    rule: 'complexity',
  }

  return {
    ...defaults,
    ...params,
  }
}

/**
 * Creates a lint issue object with specified properties omitted
 * @param keys - Array of property keys to omit
 * @param params - Optional parameters for the lint issue
 */
export const lintIssueWithout = <K extends keyof LintIssue>(
  keys: K[],
  params?: Partial<LintIssue>
): Omit<LintIssue, K> => {
  const fullLintIssue = lintIssue(params)
  return omit(fullLintIssue, keys)
}

/**
 * Creates a lint data object
 * @param params - Optional parameters for the lint data
 */
export const lintData = (params?: Partial<LintData>): LintData => {
  const defaults: LintData = {
    timestamp: '2024-01-01T00:00:00Z',
    files: ['/src/example.ts'],
    issues: [lintIssue()],
    errorCount: 1,
    warningCount: 0,
    hasBlocked: false,
  }

  return {
    ...defaults,
    ...params,
  }
}

/**
 * Creates a lint data object with specified properties omitted
 * @param keys - Array of property keys to omit
 * @param params - Optional parameters for the lint data
 */
export const lintDataWithout = <K extends keyof LintData>(
  keys: K[],
  params?: Partial<LintData>
): Omit<LintData, K> => {
  const fullLintData = lintData(params)
  return omit(fullLintData, keys)
}
