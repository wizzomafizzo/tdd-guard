import type { Config } from '@jest/types'
import type { Test, TestResult, AggregatedResult } from '@jest/reporters'
import type { AssertionResult } from '@jest/test-result'
import type { TestContext } from '@jest/test-result'
import { Storage, FileStorage, Config as TDDConfig } from 'tdd-guard'

export interface TDDGuardReporterOptions {
  storage?: Storage
  projectRoot?: string
}

export class JestReporter {
  private readonly globalConfig: Config.GlobalConfig
  private readonly storage: Storage
  private readonly testModules: Map<
    string,
    { test: Test; testResult: TestResult }
  > = new Map()

  constructor(
    globalConfig: Config.GlobalConfig,
    reporterOptions?: TDDGuardReporterOptions
  ) {
    this.globalConfig = globalConfig

    if (reporterOptions?.storage) {
      this.storage = reporterOptions.storage
    } else if (reporterOptions?.projectRoot) {
      const config = new TDDConfig({ projectRoot: reporterOptions.projectRoot })
      this.storage = new FileStorage(config)
    } else {
      this.storage = new FileStorage()
    }
  }

  onTestResult(
    test: Test,
    testResult: TestResult,
    _aggregatedResult: AggregatedResult
  ): void {
    this.testModules.set(test.path, { test, testResult })
  }

  async onRunComplete(
    _contexts: Set<TestContext>,
    results: AggregatedResult
  ): Promise<void> {
    interface TDDGuardOutput {
      testModules: Array<{
        moduleId: string
        tests: Array<{
          name: string
          fullName: string
          state: string
          errors?: Array<{ message: string }>
        }>
      }>
      unhandledErrors?: Array<{
        message: string
        name: string
        stack?: string
      }>
      reason?: 'passed' | 'failed' | 'interrupted'
    }

    const output: TDDGuardOutput = {
      testModules: Array.from(this.testModules.entries()).map(
        ([path, data]) => ({
          moduleId: path,
          tests: data.testResult.testResults.map((test: AssertionResult) => ({
            name: test.title,
            fullName: test.fullName,
            state: test.status,
            ...(test.failureMessages.length > 0 && {
              errors: test.failureMessages.map((message: string) => ({
                message,
              })),
            }),
          })),
        })
      ),
      unhandledErrors: [],
    }

    // Add unhandled errors if present
    if (results.runExecError) {
      const error = results.runExecError
      output.unhandledErrors = [
        {
          message: error.message,
          name:
            'name' in error && typeof error.name === 'string'
              ? error.name
              : 'Error',
          stack: error.stack ?? undefined,
        },
      ]
    }

    // Add reason based on test results
    if (results.wasInterrupted) {
      output.reason = 'interrupted'
    } else if (
      results.numFailedTestSuites === 0 &&
      results.numTotalTestSuites > 0
    ) {
      output.reason = 'passed'
    } else {
      output.reason = 'failed'
    }

    await this.storage.saveTest(JSON.stringify(output, null, 2))
  }
}
