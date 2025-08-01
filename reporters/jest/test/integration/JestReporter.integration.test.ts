import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Config } from '@jest/types'
import { JestReporter } from '../../src/JestReporter'
import {
  MemoryStorage,
  FileStorage,
  Storage,
  Config as TDDConfig,
} from 'tdd-guard'
import {
  TestResultSchema,
  isTestPassing,
  isFailingTest,
  isPassingTest,
} from 'tdd-guard'
import {
  createTest,
  createTestResult,
  createAggregatedResult,
  createUnhandledError,
} from '../../src/JestReporter.test-data'
import { rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import path from 'node:path'

describe('JestReporter Integration Tests', () => {
  let sut: Awaited<ReturnType<typeof setupJestReporter>>
  const globalConfig = {} as Config.GlobalConfig

  beforeEach(() => {
    sut = setupJestReporter()
  })

  afterEach(() => {
    sut.cleanup()
  })

  describe('end-to-end test data collection', () => {
    it('collects and saves test results with correct schema', async () => {
      // Arrange
      const test = createTest({ path: '/test/components/Button.test.ts' })
      const testResult = createTestResult({
        testFilePath: '/test/components/Button.test.ts',
        numPassingTests: 2,
        numFailingTests: 0,
        testResults: [
          {
            ancestorTitles: ['Button Component'],
            duration: 10,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Button Component renders correctly',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 1,
            retryReasons: [],
            status: 'passed',
            title: 'renders correctly',
          },
          {
            ancestorTitles: ['Button Component'],
            duration: 15,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Button Component handles click events',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 2,
            retryReasons: [],
            status: 'passed',
            title: 'handles click events',
          },
        ],
      })
      const aggregatedResult = createAggregatedResult({
        success: true,
        numPassedTests: 2,
      })

      // Act
      sut.reporter.onTestResult(test, testResult, aggregatedResult)
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const parsed = await sut.getParsedData()
      expect(parsed).toBeDefined()

      // Validate against schema
      const validation = TestResultSchema.safeParse(parsed)
      expect(validation.success).toBe(true)

      // Check specific content
      expect(parsed?.testModules).toHaveLength(1)
      expect(parsed?.testModules[0].moduleId).toBe(
        '/test/components/Button.test.ts'
      )
      expect(parsed?.testModules[0].tests).toHaveLength(2)
      expect(parsed?.reason).toBe('passed')
    })

    it('handles multiple test files in a single run', async () => {
      // Arrange - Multiple test files
      const tests = [
        {
          test: createTest({ path: '/test/utils/string.test.ts' }),
          result: createTestResult({
            testFilePath: '/test/utils/string.test.ts',
            numPassingTests: 3,
            testResults: Array.from({ length: 3 }, (_, i) => ({
              ancestorTitles: ['String Utils'],
              duration: 5,
              failureDetails: [],
              failureMessages: [],
              fullName: `String Utils test ${i + 1}`,
              invocations: 1,
              location: undefined,
              numPassingAsserts: 1,
              retryReasons: [],
              status: 'passed' as const,
              title: `test ${i + 1}`,
            })),
          }),
        },
        {
          test: createTest({ path: '/test/utils/array.test.ts' }),
          result: createTestResult({
            testFilePath: '/test/utils/array.test.ts',
            numPassingTests: 2,
            testResults: Array.from({ length: 2 }, (_, i) => ({
              ancestorTitles: ['Array Utils'],
              duration: 8,
              failureDetails: [],
              failureMessages: [],
              fullName: `Array Utils test ${i + 1}`,
              invocations: 1,
              location: undefined,
              numPassingAsserts: 1,
              retryReasons: [],
              status: 'passed' as const,
              title: `test ${i + 1}`,
            })),
          }),
        },
      ]
      const aggregatedResult = createAggregatedResult({
        success: true,
        numPassedTests: 5,
        numTotalTests: 5,
      })

      // Act
      tests.forEach(({ test, result }) => {
        sut.reporter.onTestResult(test, result, aggregatedResult)
      })
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const parsed = await sut.getParsedData()
      expect(parsed?.testModules).toHaveLength(2)
      expect(parsed?.testModules[0].tests).toHaveLength(3)
      expect(parsed?.testModules[1].tests).toHaveLength(2)
      expect(isTestPassing(parsed!)).toBe(true)
    })

    it('correctly reports mixed passing and failing tests', async () => {
      // Arrange
      const test = createTest({ path: '/test/api/auth.test.ts' })
      // First create a passing test result, then a failing one
      const passingResult = createTestResult({
        testFilePath: '/test/api/auth.test.ts',
        numPassingTests: 1,
        numFailingTests: 0,
        testResults: [
          {
            ancestorTitles: ['Auth API'],
            duration: 20,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Auth API validates token correctly',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 1,
            retryReasons: [],
            status: 'passed',
            title: 'validates token correctly',
          },
        ],
      })

      const failingResult = createTestResult({
        testFilePath: '/test/api/auth-errors.test.ts',
        numPassingTests: 0,
        numFailingTests: 2,
        testResults: [
          {
            ancestorTitles: ['Auth API Errors'],
            duration: 25,
            failureDetails: [{ message: 'Token expired' }],
            failureMessages: ['Expected token to be valid but got expired'],
            fullName: 'Auth API Errors handles expired tokens',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 0,
            retryReasons: [],
            status: 'failed',
            title: 'handles expired tokens',
          },
          {
            ancestorTitles: ['Auth API Errors'],
            duration: 15,
            failureDetails: [{ message: 'Invalid signature' }],
            failureMessages: ['Token signature verification failed'],
            fullName: 'Auth API Errors rejects invalid signatures',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 0,
            retryReasons: [],
            status: 'failed',
            title: 'rejects invalid signatures',
          },
        ],
      })

      const aggregatedResult = createAggregatedResult({
        success: false,
        numFailedTests: 2,
        numPassedTests: 1,
      })

      // Act
      sut.reporter.onTestResult(test, testResult, aggregatedResult)
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const parsed = await sut.getParsedData()
      const tests = await sut.getTests()
      const passedTests = await sut.getPassedTests()
      const failedTests = await sut.getFailedTests()

      expect(tests).toHaveLength(3)
      expect(passedTests).toHaveLength(1)
      expect(failedTests).toHaveLength(2)
      expect(parsed?.reason).toBe('failed')
      expect(isTestPassing(parsed!)).toBe(false)

      // Verify error details
      failedTests.forEach((test) => {
        expect(test.errors).toBeDefined()
        expect(test.errors!.length).toBeGreaterThan(0)
        expect(test.errors![0].message).toBeTruthy()
      })
    })

    it('handles test suites with skipped tests', async () => {
      // Arrange
      const test = createTest({ path: '/test/features/feature-flag.test.ts' })
      const testResult = createTestResult({
        testFilePath: '/test/features/feature-flag.test.ts',
        numPassingTests: 1,
        numPendingTests: 2,
        testResults: [
          {
            ancestorTitles: ['Feature Flags'],
            duration: 5,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Feature Flags checks enabled features',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 1,
            retryReasons: [],
            status: 'passed',
            title: 'checks enabled features',
          },
          {
            ancestorTitles: ['Feature Flags'],
            duration: 0,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Feature Flags handles experimental features',
            invocations: 0,
            location: undefined,
            numPassingAsserts: 0,
            retryReasons: [],
            status: 'pending',
            title: 'handles experimental features',
          },
          {
            ancestorTitles: ['Feature Flags'],
            duration: 0,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Feature Flags supports A/B testing',
            invocations: 0,
            location: undefined,
            numPassingAsserts: 0,
            retryReasons: [],
            status: 'skipped',
            title: 'supports A/B testing',
          },
        ],
      })
      const aggregatedResult = createAggregatedResult({
        success: true,
        numPassedTests: 1,
        numPendingTests: 2,
      })

      // Act
      sut.reporter.onTestResult(test, testResult, aggregatedResult)
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const parsed = await sut.getParsedData()
      const tests = await sut.getTests()

      expect(tests).toHaveLength(3)
      const states = tests.map((t) => t.state)
      expect(states).toContain('passed')
      expect(states).toContain('pending')
      expect(states).toContain('skipped')
    })
  })

  describe('error handling and edge cases', () => {
    it('handles runtime errors during test execution', async () => {
      // Arrange
      const error = createUnhandledError({
        name: 'ReferenceError',
        message: 'Cannot access variable before initialization',
        stack:
          'ReferenceError: Cannot access variable before initialization\n    at Object.<anonymous> (/test/broken.test.ts:5:10)',
      })
      const aggregatedResult = createAggregatedResult({
        runExecError: error,
        success: false,
        wasInterrupted: false,
      })

      // Act
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const parsed = await sut.getParsedData()
      expect(parsed?.unhandledErrors).toBeDefined()
      expect(parsed?.unhandledErrors).toHaveLength(1)
      expect(parsed?.unhandledErrors![0].name).toBe('ReferenceError')
      expect(parsed?.unhandledErrors![0].message).toContain(
        'Cannot access variable'
      )
      expect(parsed?.unhandledErrors![0].stack).toContain('broken.test.ts')
      expect(parsed?.reason).toBe('failed')
    })

    it('handles interrupted test runs', async () => {
      // Arrange
      const test = createTest({ path: '/test/slow/integration.test.ts' })
      const testResult = createTestResult({
        testFilePath: '/test/slow/integration.test.ts',
        numPassingTests: 1,
        testResults: [
          {
            ancestorTitles: ['Slow Integration Tests'],
            duration: 5000,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Slow Integration Tests completes first test',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 1,
            retryReasons: [],
            status: 'passed',
            title: 'completes first test',
          },
        ],
      })
      const aggregatedResult = createAggregatedResult({
        wasInterrupted: true,
        success: false,
        numPassedTests: 1,
      })

      // Act
      sut.reporter.onTestResult(test, testResult, aggregatedResult)
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const parsed = await sut.getParsedData()
      expect(parsed?.reason).toBe('interrupted')
      expect(parsed?.testModules[0].tests).toHaveLength(1)
    })

    it('handles empty test suites gracefully', async () => {
      // Arrange
      const aggregatedResult = createAggregatedResult({
        success: true,
        numTotalTests: 0,
        numTotalTestSuites: 0,
      })

      // Act
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const parsed = await sut.getParsedData()
      expect(parsed?.testModules).toEqual([])
      expect(parsed?.reason).toBe('passed')
      expect(isTestPassing(parsed!)).toBe(false) // No tests means not passing
    })

    it('handles SerializableError without stack trace', async () => {
      // Arrange
      const aggregatedResult = createAggregatedResult({
        runExecError: {
          message: 'Configuration error: Missing required field',
          // No stack property
        },
        success: false,
      })

      // Act
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const parsed = await sut.getParsedData()
      expect(parsed?.unhandledErrors![0].message).toBe(
        'Configuration error: Missing required field'
      )
      expect(parsed?.unhandledErrors![0].name).toBe('Error')
      expect(parsed?.unhandledErrors![0].stack).toBeUndefined()
    })
  })

  describe('storage integration', () => {
    it('works with file storage in production mode', async () => {
      // Arrange
      const localSut = setupJestReporter({ type: 'file' })
      const test = createTest({ path: '/test/file-storage.test.ts' })
      const testResult = createTestResult({
        testFilePath: '/test/file-storage.test.ts',
        numPassingTests: 1,
      })
      const aggregatedResult = createAggregatedResult({ success: true })

      // Act
      localSut.reporter.onTestResult(test, testResult, aggregatedResult)
      await localSut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const savedContent = await localSut.storage.getTest()
      expect(savedContent).toBeTruthy()
      const parsed = JSON.parse(savedContent!)
      expect(TestResultSchema.safeParse(parsed).success).toBe(true)

      // Cleanup
      localSut.cleanup()
    })

    it('accumulates results across multiple test runs', async () => {
      // Arrange - Simulate running tests in watch mode
      const runs = [
        {
          test: createTest({ path: '/test/first-run.test.ts' }),
          result: createTestResult({
            testFilePath: '/test/first-run.test.ts',
            numPassingTests: 2,
          }),
        },
        {
          test: createTest({ path: '/test/second-run.test.ts' }),
          result: createTestResult({
            testFilePath: '/test/second-run.test.ts',
            numPassingTests: 3,
          }),
        },
      ]
      const aggregatedResult = createAggregatedResult({
        success: true,
        numPassedTests: 5,
      })

      // Act - Run tests twice (simulating watch mode)
      // First run
      sut.reporter.onTestResult(runs[0].test, runs[0].result, aggregatedResult)
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Create new reporter instance (simulating new test run)
      const newReporter = new JestReporter(globalConfig, {
        storage: sut.storage,
      })

      // Second run
      newReporter.onTestResult(runs[1].test, runs[1].result, aggregatedResult)
      await newReporter.onRunComplete(new Set(), aggregatedResult)

      // Assert - Only latest run should be saved
      const parsed = await sut.getParsedData()
      expect(parsed?.testModules).toHaveLength(1)
      expect(parsed?.testModules[0].moduleId).toBe('/test/second-run.test.ts')
    })
  })

  describe('complex test scenarios', () => {
    it('handles deeply nested test suites', async () => {
      // Arrange
      const test = createTest({
        path: '/test/nested/deeply/component.test.tsx',
      })
      const testResult = createTestResult({
        testFilePath: '/test/nested/deeply/component.test.tsx',
        numPassingTests: 3,
        testResults: [
          {
            ancestorTitles: ['App', 'Components', 'Forms', 'Input'],
            duration: 12,
            failureDetails: [],
            failureMessages: [],
            fullName: 'App Components Forms Input renders with placeholder',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 1,
            retryReasons: [],
            status: 'passed',
            title: 'renders with placeholder',
          },
          {
            ancestorTitles: [
              'App',
              'Components',
              'Forms',
              'Input',
              'Validation',
            ],
            duration: 18,
            failureDetails: [],
            failureMessages: [],
            fullName:
              'App Components Forms Input Validation shows error for invalid email',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 2,
            retryReasons: [],
            status: 'passed',
            title: 'shows error for invalid email',
          },
          {
            ancestorTitles: [
              'App',
              'Components',
              'Forms',
              'Input',
              'Validation',
            ],
            duration: 15,
            failureDetails: [],
            failureMessages: [],
            fullName:
              'App Components Forms Input Validation accepts valid email',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 1,
            retryReasons: [],
            status: 'passed',
            title: 'accepts valid email',
          },
        ],
      })
      const aggregatedResult = createAggregatedResult({
        success: true,
        numPassedTests: 3,
      })

      // Act
      sut.reporter.onTestResult(test, testResult, aggregatedResult)
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const parsed = await sut.getParsedData()
      const tests = await sut.getTests()

      expect(tests).toHaveLength(3)
      tests.forEach((test) => {
        expect(test.fullName).toContain('App Components Forms Input')
        expect(test.state).toBe('passed')
      })
    })

    it('handles retried tests correctly', async () => {
      // Arrange
      const test = createTest({ path: '/test/flaky/network.test.ts' })
      const testResult = createTestResult({
        testFilePath: '/test/flaky/network.test.ts',
        numPassingTests: 1,
        testResults: [
          {
            ancestorTitles: ['Network Tests'],
            duration: 100,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Network Tests retries on timeout',
            invocations: 3, // Test was retried 3 times
            location: undefined,
            numPassingAsserts: 1,
            retryReasons: ['Network timeout after 50ms', 'Connection refused'],
            status: 'passed',
            title: 'retries on timeout',
          },
        ],
      })
      const aggregatedResult = createAggregatedResult({
        success: true,
        numPassedTests: 1,
      })

      // Act
      sut.reporter.onTestResult(test, testResult, aggregatedResult)
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const parsed = await sut.getParsedData()
      const tests = await sut.getTests()

      expect(tests).toHaveLength(1)
      expect(tests[0].state).toBe('passed')
      // Note: retryReasons are not included in the output schema,
      // but the test eventually passed
    })

    it('handles todo tests appropriately', async () => {
      // Arrange
      const test = createTest({ path: '/test/todo/future-features.test.ts' })
      const testResult = createTestResult({
        testFilePath: '/test/todo/future-features.test.ts',
        numTodoTests: 2,
        numPassingTests: 1,
        testResults: [
          {
            ancestorTitles: ['Future Features'],
            duration: 10,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Future Features basic functionality works',
            invocations: 1,
            location: undefined,
            numPassingAsserts: 1,
            retryReasons: [],
            status: 'passed',
            title: 'basic functionality works',
          },
          {
            ancestorTitles: ['Future Features'],
            duration: 0,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Future Features advanced feature',
            invocations: 0,
            location: undefined,
            numPassingAsserts: 0,
            retryReasons: [],
            status: 'todo',
            title: 'advanced feature',
          },
          {
            ancestorTitles: ['Future Features'],
            duration: 0,
            failureDetails: [],
            failureMessages: [],
            fullName: 'Future Features premium feature',
            invocations: 0,
            location: undefined,
            numPassingAsserts: 0,
            retryReasons: [],
            status: 'todo',
            title: 'premium feature',
          },
        ],
      })
      const aggregatedResult = createAggregatedResult({
        success: true,
        numPassedTests: 1,
        numTodoTests: 2,
      })

      // Act
      sut.reporter.onTestResult(test, testResult, aggregatedResult)
      await sut.reporter.onRunComplete(new Set(), aggregatedResult)

      // Assert
      const tests = await sut.getTests()
      expect(tests).toHaveLength(3)

      const todoTests = tests.filter((t) => t.state === 'todo')
      expect(todoTests).toHaveLength(2)
    })
  })
})

// Test setup helper function
function setupJestReporter(options?: { type: 'file' | 'memory' }) {
  // Test directory setup for FileStorage tests
  let projectRoot: string | undefined

  // Create storage based on options
  let storage: Storage
  if (options?.type === 'file') {
    projectRoot = mkdtempSync(join(tmpdir(), 'jest-reporter-test-'))
    const config = new TDDConfig({ projectRoot })
    storage = new FileStorage(config)
  } else {
    storage = new MemoryStorage()
  }

  const globalConfig = {} as Config.GlobalConfig
  const reporter = new JestReporter(globalConfig, { storage })

  // Helper to get parsed test data
  const getParsedData = async () => {
    const content = await storage.getTest()
    return content ? JSON.parse(content) : null
  }

  // Helper to get tests array
  const getTests = async () => {
    const parsed = await getParsedData()
    return parsed?.testModules[0]?.tests ?? []
  }

  // Helper to get passing tests
  const getPassedTests = async () => {
    const tests = await getTests()
    return tests.filter(isPassingTest)
  }

  // Helper to get failing tests
  const getFailedTests = async () => {
    const tests = await getTests()
    return tests.filter(isFailingTest)
  }

  // Cleanup function
  const cleanup = () => {
    if (projectRoot) {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  }

  return {
    reporter,
    storage,
    getParsedData,
    getTests,
    getPassedTests,
    getFailedTests,
    cleanup,
  }
}
