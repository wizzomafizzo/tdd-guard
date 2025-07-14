/**
 * Factory functions for creating Lint test data
 */

import type {
  LintIssue,
  LintData,
  ESLintMessage,
  ESLintResult,
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
    hasNotifiedAboutLintIssues: false,
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

/**
 * Creates an ESLint message object
 * @param params - Optional parameters for the ESLint message
 */
export const eslintMessage = (
  params?: Partial<ESLintMessage>
): ESLintMessage => {
  const defaults: ESLintMessage = {
    line: 10,
    column: 5,
    severity: 2,
    message: 'Unexpected var, use let or const instead',
    ruleId: 'no-var',
  }

  return {
    ...defaults,
    ...params,
  }
}

/**
 * Creates an ESLint message object with specified properties omitted
 * @param keys - Array of property keys to omit
 * @param params - Optional parameters for the ESLint message
 */
export const eslintMessageWithout = <K extends keyof ESLintMessage>(
  keys: K[],
  params?: Partial<ESLintMessage>
): Omit<ESLintMessage, K> => {
  const fullMessage = eslintMessage(params)
  return omit(fullMessage, keys)
}

/**
 * Creates an ESLint result object
 * @param params - Optional parameters for the ESLint result
 */
export const eslintResult = (params?: Partial<ESLintResult>): ESLintResult => {
  const defaults: ESLintResult = {
    filePath: '/src/example.ts',
    messages: [eslintMessage()],
  }

  return {
    ...defaults,
    ...params,
  }
}

/**
 * Creates an ESLint result object with specified properties omitted
 * @param keys - Array of property keys to omit
 * @param params - Optional parameters for the ESLint result
 */
export const eslintResultWithout = <K extends keyof ESLintResult>(
  keys: K[],
  params?: Partial<ESLintResult>
): Omit<ESLintResult, K> => {
  const fullResult = eslintResult(params)
  return omit(fullResult, keys)
}
