import { describe, it, expect, beforeEach } from 'vitest'
import { TestResultsProcessor } from './TestResultsProcessor'
import { testData } from '../../../test/utils'

describe('TestResultsProcessor', () => {
  it('should format empty test results', () => {
    const processor = new TestResultsProcessor()
    const result = processor.process('{}')

    expect(result).toBe('No test results found.')
  })

  it('should handle invalid JSON gracefully', () => {
    const processor = new TestResultsProcessor()
    const result = processor.process('invalid json')

    expect(result).toBe('Invalid JSON format.')
  })

  it('should handle invalid test result format', () => {
    const processor = new TestResultsProcessor()
    const result = processor.process('{"testModules": "not an array"}')

    expect(result).toBe('Invalid test result format.')
  })

  describe('scenarios', () => {
    it('2 passing tests in the same file', () => {
      const processor = new TestResultsProcessor()
      const testResults = testData.passingTestResults()

      const result = processor.process(JSON.stringify(testResults))

      const expected = ` ✓ /src/example.test.ts (2 tests) 0ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
`

      expect(result).toBe(expected)
    })

    it('2 failing tests in the same file', () => {
      const processor = new TestResultsProcessor()
      const testResults = testData.multipleFailedTestResults()

      const result = processor.process(JSON.stringify(testResults))

      const expected = ` ❯ /src/calculator.test.ts (2 tests | 2 failed) 0ms
   × Calculator > should add two numbers 0ms
     → expected 5 to be 6
   × Calculator > should multiply two numbers 0ms
     → expected 12 to be 15

 Test Files  1 failed (1)
      Tests  2 failed (2)
`

      expect(result).toBe(expected)
    })

    it('1 passing and 1 failing test in the same file', () => {
      const processor = new TestResultsProcessor()
      const testResults = testData.mixedTestResults()

      const result = processor.process(JSON.stringify(testResults))

      const expected = ` ❯ /src/calculator.test.ts (2 tests | 1 failed) 0ms
   ✓ Calculator > should add two numbers 0ms
   × Calculator > should multiply two numbers 0ms
     → expected 12 to be 15

 Test Files  1 failed | 0 passed (1)
      Tests  1 failed | 1 passed (2)
`

      expect(result).toBe(expected)
    })

    it('2 files with a passing and a failing test pair in each', () => {
      const processor = new TestResultsProcessor()
      const testResults = testData.multipleModulesTestResults()

      const result = processor.process(JSON.stringify(testResults))

      const expected = ` ❯ /src/calculator.test.ts (2 tests | 1 failed) 0ms
   ✓ Calculator > should add two numbers 0ms
   × Calculator > should multiply two numbers 0ms
     → expected 12 to be 15
 ❯ /src/utils/formatter.test.ts (2 tests | 1 failed) 0ms
   ✓ Formatter > should format currency 0ms
   × Formatter > should format date 0ms
     → expected "2024-01-01" to be "01/01/2024"

 Test Files  2 failed | 0 passed (2)
      Tests  2 failed | 2 passed (4)
`

      expect(result).toBe(expected)
    })
  })
  describe('formats unhandled errors separately from test results', () => {
    let processor: TestResultsProcessor
    let result: string

    beforeEach(() => {
      processor = new TestResultsProcessor()
      const testResults = {
        testModules: [
          {
            moduleId: '/src/example.test.ts',
            tests: [],
          },
        ],
        unhandledErrors: [testData.createUnhandledError()],
      }

      result = processor.process(JSON.stringify(testResults))
    })

    it('shows module as passed with 0 tests', () => {
      expect(result).toContain('✓ /src/example.test.ts (0 tests)')
    })

    it('displays unhandled errors section', () => {
      expect(result).toContain('Unhandled Errors:')
    })

    it('shows error name and message', () => {
      expect(result).toContain('× Error: Cannot find module "./helpers"')
    })

    it('includes stack trace', () => {
      expect(result).toContain('Stack:')
      expect(result).toContain('imported from')
    })

    it('summary shows passed test file', () => {
      expect(result).toContain('Test Files  1 passed (1)')
    })

    it('summary shows 0 tests', () => {
      expect(result).toContain('Tests  0 passed (0)')
    })
  })
})
