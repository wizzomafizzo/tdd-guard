import { describe, test, expect, beforeEach } from 'vitest'
import { ESLint } from './ESLint'
import { join } from 'path'
import { LintResult } from '../../contracts/schemas/lintSchemas'
import { hasRules, issuesFromFile } from '../../../test/utils/assertions'

describe('ESLint', () => {
  let linter: ESLint

  beforeEach(() => {
    linter = new ESLint()
  })

  test('can be instantiated', () => {
    expect(linter).toBeDefined()
  })

  test('implements Linter interface with lint method', async () => {
    const result = await linter.lint([])

    expect(result).toBeDefined()
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  test('returns the file paths that were passed in', async () => {
    const filePaths = ['src/file1.ts', 'src/file2.ts']
    const result = await linter.lint(filePaths)

    expect(result.files).toEqual(filePaths)
  })

  describe('with single file', () => {
    let result: LintResult

    beforeEach(async () => {
      result = await linter.lint(['src/file.ts'])
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

  describe('with files containing special characters', () => {
    test.each([
      ['spaces', 'src/my file with spaces.ts'],
      ['quotes', 'src/file"with"quotes.ts'],
      ['semicolons', 'src/file;name.ts'],
      ['backticks', 'src/file`with`backticks.ts'],
      ['dollar signs', 'src/file$with$dollar.ts'],
      ['pipes', 'src/file|with|pipes.ts'],
      ['ampersands', 'src/file&with&ampersands.ts'],
      ['parentheses', 'src/file(with)parentheses.ts'],
      ['command injection attempt', 'file.js"; cat /etc/passwd; echo "'],
      ['newlines', 'src/file\nwith\nnewlines.ts'],
      ['tabs', 'src/file\twith\ttabs.ts'],
    ])('handles file paths with %s correctly', async (_, filePath) => {
      const result = await linter.lint([filePath])

      expect(result.files).toEqual([filePath])
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test.each([
      ['spaces', '/path with spaces/eslint.config.js'],
      ['quotes', '/path"with"quotes/eslint.config.js'],
      ['special chars', '/path;with&special|chars/eslint.config.js'],
    ])('handles config paths with %s correctly', async (_, configPath) => {
      const result = await linter.lint(['src/file.ts'], configPath)

      expect(result.files).toEqual(['src/file.ts'])
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('linter.lint with artifact files', () => {
    const artifactsDir = join(process.cwd(), 'test', 'artifacts')
    const configPath = join(artifactsDir, 'eslint.config.js')

    test('detects issues in file with lint problems', async () => {
      const filePath = join(artifactsDir, 'file-with-issues.js')
      const result = await linter.lint([filePath], configPath)

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
      const result = await linter.lint([filePath], configPath)

      expect(result.issues.length).toBe(0)
      expect(result.errorCount).toBe(0)
      expect(result.warningCount).toBe(0)
    })

    test('processes multiple files correctly', async () => {
      const files = [
        join(artifactsDir, 'file-with-issues.js'),
        join(artifactsDir, 'file-without-issues.js'),
      ]
      const result = await linter.lint(files, configPath)

      expect(result.files).toEqual(files)
      expect(result.issues.length).toBeGreaterThan(0)

      // Issues should only be from the file with issues
      const cleanFileIssues = issuesFromFile(
        result.issues,
        'file-without-issues.js'
      )
      expect(cleanFileIssues.length).toBe(0)
    })
  })
})
