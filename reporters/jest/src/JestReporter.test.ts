import { describe, it, expect } from 'vitest'
import type { Config } from '@jest/types'
import { JestReporter } from './JestReporter'
import { FileStorage, MemoryStorage, Config as TDDConfig } from 'tdd-guard'
import path from 'node:path'
import {
  createTest,
  createTestResult,
  createAggregatedResult,
  createUnhandledError,
} from './JestReporter.test-data'

describe('JestReporter', () => {
  describe('constructor', () => {
    it('accepts globalConfig as first parameter', () => {
      const globalConfig = { rootDir: '/test/root' } as Config.GlobalConfig
      const reporter = new JestReporter(globalConfig)
      expect(reporter['globalConfig']).toBe(globalConfig)
    })

    it('uses FileStorage by default', () => {
      const globalConfig = {} as Config.GlobalConfig
      const reporter = new JestReporter(globalConfig)
      expect(reporter['storage']).toBeInstanceOf(FileStorage)
    })

    it('accepts Storage instance in reporterOptions', () => {
      const globalConfig = {} as Config.GlobalConfig
      const storage = new MemoryStorage()
      const reporterOptions = { storage }
      const reporter = new JestReporter(globalConfig, reporterOptions)
      expect(reporter['storage']).toBe(storage)
    })

    it('accepts projectRoot string in reporterOptions', () => {
      const globalConfig = {} as Config.GlobalConfig
      const rootPath = '/some/project/root'
      const reporterOptions = { projectRoot: rootPath }
      const reporter = new JestReporter(globalConfig, reporterOptions)
      expect(reporter['storage']).toBeInstanceOf(FileStorage)
      // Verify the storage is configured with the correct path
      const fileStorage = reporter['storage'] as FileStorage
      const config = fileStorage['config'] as TDDConfig
      const expectedDataDir = path.join(
        rootPath,
        ...TDDConfig.DEFAULT_DATA_DIR.split('/')
      )
      expect(config.dataDir).toBe(expectedDataDir)
    })
  })

  describe('onTestResult', () => {
    it('collects test results', () => {
      const globalConfig = {} as Config.GlobalConfig
      const reporter = new JestReporter(globalConfig)
      const test = createTest()
      const testResult = createTestResult()
      const aggregatedResult = createAggregatedResult()

      reporter.onTestResult(test, testResult, aggregatedResult)

      expect(reporter['testModules'].size).toBe(1)
    })
  })

  describe('onRunComplete', () => {
    it('saves test results to storage', async () => {
      const globalConfig = {} as Config.GlobalConfig
      const storage = new MemoryStorage()
      const reporter = new JestReporter(globalConfig, { storage })
      const test = createTest()
      const testResult = createTestResult()
      const aggregatedResult = createAggregatedResult()

      // Collect test results first
      reporter.onTestResult(test, testResult, aggregatedResult)

      // Run complete
      await reporter.onRunComplete(new Set(), aggregatedResult)

      // Verify results were saved
      const savedData = await storage.getTest()
      expect(savedData).toBeTruthy()
      const parsed = JSON.parse(savedData!)
      expect(parsed.testModules).toHaveLength(1)
    })

    it('includes test case details in output', async () => {
      const globalConfig = {} as Config.GlobalConfig
      const storage = new MemoryStorage()
      const reporter = new JestReporter(globalConfig, { storage })
      const test = createTest()
      const testResult = createTestResult()
      const aggregatedResult = createAggregatedResult()

      // Collect test results
      reporter.onTestResult(test, testResult, aggregatedResult)

      // Run complete
      await reporter.onRunComplete(new Set(), aggregatedResult)

      // Verify test details are included
      const savedData = await storage.getTest()
      const parsed = JSON.parse(savedData!)
      const module = parsed.testModules[0]
      expect(module.tests).toHaveLength(1)
      expect(module.tests[0].name).toBe('should pass')
      expect(module.tests[0].fullName).toBe('Example Suite should pass')
      expect(module.tests[0].state).toBe('passed')
    })

    it('includes error details for failed tests', async () => {
      const globalConfig = {} as Config.GlobalConfig
      const storage = new MemoryStorage()
      const reporter = new JestReporter(globalConfig, { storage })
      const test = createTest()
      const failedTestResult = createTestResult({ numFailingTests: 1 })
      const aggregatedResult = createAggregatedResult()

      // Collect test results
      reporter.onTestResult(test, failedTestResult, aggregatedResult)

      // Run complete
      await reporter.onRunComplete(new Set(), aggregatedResult)

      // Verify error details are included
      const savedData = await storage.getTest()
      const parsed = JSON.parse(savedData!)
      const module = parsed.testModules[0]
      const failedTest = module.tests[0]
      expect(failedTest.state).toBe('failed')
      expect(failedTest.errors).toBeDefined()
      expect(failedTest.errors).toHaveLength(1)
      expect(failedTest.errors[0].message).toBe('expected 2 to be 3')
    })

    it('handles empty test runs', async () => {
      const globalConfig = {} as Config.GlobalConfig
      const storage = new MemoryStorage()
      const reporter = new JestReporter(globalConfig, { storage })

      // Run complete without any tests
      await reporter.onRunComplete(new Set(), createAggregatedResult())

      // Verify empty output
      const savedData = await storage.getTest()
      const parsed = JSON.parse(savedData!)
      expect(parsed.testModules).toEqual([])
    })

    it('includes unhandled errors in output', async () => {
      const globalConfig = {} as Config.GlobalConfig
      const storage = new MemoryStorage()
      const reporter = new JestReporter(globalConfig, { storage })
      const error = createUnhandledError()
      const aggregatedResult = createAggregatedResult({
        runExecError: error,
      })

      // Run complete with unhandled error
      await reporter.onRunComplete(new Set(), aggregatedResult)

      // Verify unhandled errors are included
      const savedData = await storage.getTest()
      const parsed = JSON.parse(savedData!)
      expect(parsed.unhandledErrors).toBeDefined()
      expect(parsed.unhandledErrors).toHaveLength(1)
      expect(parsed.unhandledErrors[0].message).toBe(
        'Cannot find module "./helpers"'
      )
      expect(parsed.unhandledErrors[0].name).toBe('Error')
      expect(parsed.unhandledErrors[0].stack).toContain('imported from')
    })

    it('includes test run reason when tests pass', async () => {
      const globalConfig = {} as Config.GlobalConfig
      const storage = new MemoryStorage()
      const reporter = new JestReporter(globalConfig, { storage })
      const test = createTest()
      const testResult = createTestResult()
      const aggregatedResult = createAggregatedResult({
        success: true,
        numFailedTests: 0,
      })

      reporter.onTestResult(test, testResult, aggregatedResult)
      await reporter.onRunComplete(new Set(), aggregatedResult)

      const savedData = await storage.getTest()
      const parsed = JSON.parse(savedData!)
      expect(parsed.reason).toBe('passed')
    })

    it('handles SerializableError without name property', async () => {
      const globalConfig = {} as Config.GlobalConfig
      const storage = new MemoryStorage()
      const reporter = new JestReporter(globalConfig, { storage })
      const aggregatedResult = createAggregatedResult({
        runExecError: {
          message: 'Module not found',
          stack: 'at test.js:1:1',
        },
      })

      await reporter.onRunComplete(new Set(), aggregatedResult)

      const savedData = await storage.getTest()
      const parsed = JSON.parse(savedData!)
      expect(parsed.unhandledErrors[0].message).toBe('Module not found')
      expect(parsed.unhandledErrors[0].name).toBe('Error')
      expect(parsed.unhandledErrors[0].stack).toBe('at test.js:1:1')
    })
  })
})
