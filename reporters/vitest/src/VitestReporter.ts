import { Reporter, TestModule, TestCase, TestRunEndReason } from 'vitest/node'
import type { SerializedError } from '@vitest/utils'
import { Storage, FileStorage, Config } from 'tdd-guard'
import { basename } from 'node:path'
import type {
  FormattedError,
  FormattedTest,
  ModuleResult,
  TestRunOutput,
} from './types'

export class VitestReporter implements Reporter {
  private readonly storage: Storage
  private readonly collectedData = new Map<
    string,
    {
      module: TestModule
      tests: TestCase[]
    }
  >()

  constructor(storageOrRoot?: Storage | string) {
    this.storage =
      typeof storageOrRoot === 'string'
        ? new FileStorage(new Config({ projectRoot: storageOrRoot }))
        : (storageOrRoot ?? new FileStorage())
  }

  onTestModuleCollected(testModule: TestModule): void {
    this.collectedData.set(testModule.moduleId, {
      module: testModule,
      tests: [],
    })
  }

  onTestCaseResult(testCase: TestCase): void {
    const moduleId = testCase.module.moduleId
    if (!moduleId) return

    this.collectedData.get(moduleId)?.tests.push(testCase)
  }

  async onTestRunEnd(
    _testModules?: unknown,
    _errors?: unknown,
    reason?: TestRunEndReason
  ): Promise<void> {
    const testModules = formatAllModuleResults(this.collectedData)
    const output = createTestRunOutput(testModules, reason)
    await this.storage.saveTest(JSON.stringify(output, null, 2))
  }
}

function createTestRunOutput(
  testModules: ModuleResult[],
  reason?: TestRunEndReason
): TestRunOutput {
  return {
    testModules,
    unhandledErrors: [],
    ...(reason && { reason }),
  }
}

function formatAllModuleResults(
  collectedData: Map<string, { module: TestModule; tests: TestCase[] }>
): ModuleResult[] {
  return Array.from(collectedData, ([moduleId, data]) => ({
    moduleId,
    tests: getFormattedTests(moduleId, data.module, data.tests),
  }))
}

function getFormattedTests(
  moduleId: string,
  testModule: TestModule,
  tests: TestCase[]
): FormattedTest[] {
  if (moduleFailedToLoad(testModule, tests)) {
    return createTestForFailedModule(moduleId, testModule)
  }

  return formatNormalTests(tests)
}

function moduleFailedToLoad(
  testModule: TestModule,
  tests: TestCase[]
): boolean {
  // Module has import/syntax errors and couldn't run any tests
  return testModule.errors().length > 0 && tests.length === 0
}

function createTestForFailedModule(
  moduleId: string,
  testModule: TestModule
): FormattedTest[] {
  return [
    {
      name: basename(moduleId),
      fullName: moduleId,
      state: 'failed',
      errors: testModule.errors().map(formatError),
    },
  ]
}

function formatNormalTests(tests: TestCase[]): FormattedTest[] {
  return tests.map((test) => {
    const result = test.result()
    return {
      name: test.name,
      fullName: test.fullName,
      state: result.state === 'pending' ? 'skipped' : result.state,
      errors: result.errors?.map(formatError),
    }
  })
}

function formatError(error: SerializedError): FormattedError {
  return {
    message: error.message,
    stack: error.stack,
    expected: error.expected,
    actual: error.actual,
  }
}
