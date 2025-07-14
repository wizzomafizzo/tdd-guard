import { describe, test, expect, beforeEach } from 'vitest'
import { runESLint } from './eslintRunner'
import { join } from 'path'
import type { LintData, LintIssue } from '../contracts/schemas/lintSchemas'

describe('runESLint', () => {
  test('returns lint data with timestamp when called', async () => {
    const result = await runESLint([])
    
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  test('returns the file paths that were passed in', async () => {
    const filePaths = ['src/file1.ts', 'src/file2.ts']
    const result = await runESLint(filePaths)
    
    expect(result.files).toEqual(filePaths)
  })

  describe('with single file', () => {
    // TODO: Create separate schema for ESLint runner output (without hasNotifiedAboutLintIssues flag)
    let result: Omit<LintData, 'hasNotifiedAboutLintIssues'>
    
    beforeEach(async () => {
      result = await runESLint(['src/file.ts'])
    })

    test('returns empty issues array', () => {
      expect(result.issues).toEqual([])
    })

    test('returns zero error count', () => {
      expect(result.errorCount).toBe(0)
    })

    test('returns zero warning count', () => {
      expect(result.warningCount).toBe(0)
    })
  })
})

describe('runESLint with artifact files', () => {
  const artifactsDir = join(process.cwd(), 'test', 'artifacts')
  const configPath = join(artifactsDir, 'eslint.config.js')
  
  test('detects issues in file with lint problems', async () => {
    const filePath = join(artifactsDir, 'file-with-issues.js')
    const result = await runESLint([filePath], configPath)
    
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.errorCount).toBeGreaterThan(0)
    
    // Check for specific rules
    const expectedRules = ['no-unused-vars', 'no-var', 'semi', 'quotes']
    const ruleResults = hasRules(result.issues, expectedRules)
    
    ruleResults.forEach((ruleExists) => {
      expect(ruleExists).toBe(true)
    })
  })
  
  test('finds no issues in clean file', async () => {
    const filePath = join(artifactsDir, 'file-without-issues.js')
    const result = await runESLint([filePath], configPath)
    
    expect(result.issues.length).toBe(0)
    expect(result.errorCount).toBe(0)
    expect(result.warningCount).toBe(0)
  })
  
  test('processes multiple files correctly', async () => {
    const files = [
      join(artifactsDir, 'file-with-issues.js'),
      join(artifactsDir, 'file-without-issues.js')
    ]
    const result = await runESLint(files, configPath)
    
    expect(result.files).toEqual(files)
    expect(result.issues.length).toBeGreaterThan(0)
    
    // Issues should only be from the file with issues
    const cleanFileIssues = issuesFromFile(result.issues, 'file-without-issues.js')
    expect(cleanFileIssues.length).toBe(0)
  })
})

// Test helper functions
function hasRule(issues: LintIssue[], rule: string): boolean {
  return issues.some(issue => issue.rule === rule)
}

function hasRules(issues: LintIssue[], rules: string[]): boolean[] {
  return rules.map(rule => hasRule(issues, rule))
}

function issuesFromFile(issues: LintIssue[], filename: string): LintIssue[] {
  return issues.filter(issue => issue.file.includes(filename))
}