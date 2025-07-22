import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { TestModule, TestCase } from 'vitest/node'
import { VitestReporter } from './VitestReporter'
import { MemoryStorage, FileStorage, Storage } from '@tdd-guard/storage'
import { Config } from '@tdd-guard/config'
import { testData } from '@testUtils'
import {
  isFailingTest,
  isPassingTest,
  TestResult,
  Test,
} from '@tdd-guard/contracts'
import { rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('VitestReporter', () => {
  let sut: Awaited<ReturnType<typeof setupVitestReporter>>
  const module = testData.testModule()
  const passedTest = testData.passedTestCase()
  const failedTest = testData.failedTestCase()

  beforeEach(() => {
    sut = setupVitestReporter()
  })

  afterEach(() => {
    sut.cleanup()
  })

  it('uses FileStorage by default', () => {
    const reporter = new VitestReporter()
    expect(reporter['storage']).toBeInstanceOf(FileStorage)
  })

  it('uses FileStorage when no storage provided', async () => {
    const localSut = setupVitestReporter({ type: 'file' })

    expect(localSut.reporter['storage']).toBeInstanceOf(FileStorage)

    const result = await localSut.collectAndGetSaved([
      testData.testModule(),
      testData.passedTestCase(),
    ])

    expect(result).toBeTruthy()
    expect(result).toContain('testModules')

    localSut.cleanup()
  })

  it('accepts Storage instance in constructor', () => {
    const storage = new MemoryStorage()
    const reporter = new VitestReporter(storage)
    expect(reporter['storage']).toBe(storage)
  })

  describe('when collecting test data', () => {
    beforeEach(async () => {
      sut.reporter.onTestModuleCollected(module)
      sut.reporter.onTestCaseResult(passedTest)
      sut.reporter.onTestCaseResult(failedTest)
      await sut.reporter.onTestRunEnd()
    })

    it('saves output as valid JSON', async () => {
      const parsed = await sut.getParsedData()
      expect(parsed).toBeDefined()
    })

    it('includes test modules', async () => {
      const parsed = await sut.getParsedData()

      expect(parsed).not.toBeNull()
      expect(parsed?.testModules).toHaveLength(1)
      expect(parsed?.testModules[0].moduleId).toBe(module.moduleId)
    })

    it('includes test cases', async () => {
      const tests = await sut.getTests()
      expect(tests).toHaveLength(2)
    })

    it('captures test states', async () => {
      const passedTests = await sut.getPassedTests()
      const failedTests = await sut.getFailedTests()

      expect(passedTests).toHaveLength(1)
      expect(failedTests).toHaveLength(1)
    })

    it('includes error information for failed tests', async () => {
      const failedTests = await sut.getFailedTests()
      const failedTestData = failedTests[0]

      expect(failedTestData).toBeDefined()
      expect(failedTestData.state).toBe('failed')
      expect(failedTestData.errors).toBeDefined()
      expect(failedTestData.errors?.length).toBeGreaterThan(0)
    })
  })

  it('handles empty test runs', async () => {
    // When no tests are collected
    await sut.reporter.onTestRunEnd()

    // Then output should be valid JSON with empty modules
    const parsed = await sut.getParsedData()

    expect(parsed).not.toBeNull()
    expect(parsed).toEqual({ testModules: [], unhandledErrors: [] })
  })

  describe('storage integration', () => {
    it('saves test output to storage', async () => {
      const result = await sut.collectAndGetSaved([
        testData.testModule(),
        testData.passedTestCase(),
      ])

      expect(result).toBeTruthy()
      expect(result).toContain('testModules')
      expect(result).toContain('passed')
    })

    it('accumulates multiple test results in storage', async () => {
      const result = await sut.collectAndGetSaved([
        module,
        passedTest,
        failedTest,
      ])

      const parsed = JSON.parse(result!)
      expect(parsed.testModules[0].tests).toHaveLength(2)
    })
  })

  describe('stores import errors as unhandled errors', () => {
    let parsed: TestResult | null

    beforeEach(async () => {
      // Given a module that was collected but has no tests due to import error
      const moduleWithImportError = testData.testModule({
        moduleId: '/src/example.test.ts',
      })

      // And an error indicating import failure
      const importError = testData.createUnhandledError()

      // When the test run ends with errors
      sut.reporter.onTestModuleCollected(moduleWithImportError)
      await sut.reporter.onTestRunEnd([], [importError])

      parsed = await sut.getParsedData()
    })

    it('includes the module in test modules', () => {
      expect(parsed?.testModules).toHaveLength(1)
    })

    it('shows module with no tests', () => {
      expect(parsed?.testModules[0].tests).toHaveLength(0)
    })

    it('includes error in unhandled errors', () => {
      expect(parsed?.unhandledErrors).toHaveLength(1)
    })

    it('preserves error message', () => {
      expect(parsed?.unhandledErrors?.[0].message).toBe(
        'Cannot find module "./helpers"'
      )
    })

    it('preserves error name', () => {
      expect(parsed?.unhandledErrors?.[0].name).toBe('Error')
    })

    it('preserves error stack trace', () => {
      expect(parsed?.unhandledErrors?.[0].stack).toContain('imported from')
    })
  })

  describe('when test run ends with reason', () => {
    it('captures "failed" reason in output', async () => {
      const moduleWithImportError = testData.testModule({
        moduleId: '/src/linters/eslint/helpers.test.ts',
      })

      sut.reporter.onTestModuleCollected(moduleWithImportError)
      await sut.reporter.onTestRunEnd([], [], 'failed')

      const parsed = await sut.getParsedData()

      expect(parsed?.reason).toBe('failed')
      expect(parsed?.testModules[0].tests).toHaveLength(0)
    })

    it('captures "interrupted" reason in output', async () => {
      await sut.reporter.onTestRunEnd([], [], 'interrupted')

      const parsed = await sut.getParsedData()
      expect(parsed?.reason).toBe('interrupted')
    })

    it('captures "passed" reason in output', async () => {
      sut.reporter.onTestModuleCollected(module)
      sut.reporter.onTestCaseResult(passedTest)
      await sut.reporter.onTestRunEnd([], [], 'passed')

      const parsed = await sut.getParsedData()
      expect(parsed?.reason).toBe('passed')
    })
  })
})

// Type guards
function isTestModule(item: TestModule | TestCase): item is TestModule {
  return 'moduleId' in item && !('module' in item)
}

function isTestCase(item: TestModule | TestCase): item is TestCase {
  return 'result' in item
}

function setupVitestReporter(options?: { type: 'file' | 'memory' }) {
  // Test directory setup for FileStorage tests
  let testDir: string | undefined

  // Create storage based on options
  let storage: Storage
  if (options?.type === 'file') {
    testDir = mkdtempSync(join(tmpdir(), 'vitest-reporter-test-'))
    const config = new Config({ dataDir: testDir })
    storage = new FileStorage(config)
  } else {
    storage = new MemoryStorage()
  }

  const reporter = new VitestReporter(storage)

  // Helper to collect test data and get saved content
  const collectAndGetSaved = async (
    items: Array<TestModule | TestCase>
  ): Promise<string | null> => {
    for (const item of items) {
      if (isTestModule(item)) {
        reporter.onTestModuleCollected(item)
      } else if (isTestCase(item)) {
        reporter.onTestCaseResult(item)
      }
    }

    await reporter.onTestRunEnd()
    return storage.getTest()
  }

  // Test data access helpers
  const getParsedData = async (): Promise<TestResult | null> => {
    const content = await storage.getTest()
    return content ? JSON.parse(content) : null
  }

  const getTests = async (): Promise<Test[]> => {
    const parsed = await getParsedData()
    return parsed?.testModules[0]?.tests ?? []
  }

  const getPassedTests = async (): Promise<(Test & { state: 'passed' })[]> => {
    const tests = await getTests()
    return tests.filter(isPassingTest)
  }

  const getFailedTests = async (): Promise<(Test & { state: 'failed' })[]> => {
    const tests = await getTests()
    return tests.filter(isFailingTest)
  }

  // Cleanup function
  const cleanup = (): void => {
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true })
    }
  }

  return {
    reporter,
    storage,
    collectAndGetSaved,
    getParsedData,
    getTests,
    getPassedTests,
    getFailedTests,
    cleanup,
  }
}
