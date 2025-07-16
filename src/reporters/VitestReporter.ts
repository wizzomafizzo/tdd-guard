import { Reporter, TestModule, TestCase, TestRunEndReason } from 'vitest/node'
import { Storage } from '../storage/Storage'
import { FileStorage } from '../storage/FileStorage'

export class VitestReporter implements Reporter {
  private readonly storage: Storage
  private readonly testModules: Map<
    string,
    {
      moduleId: string
      testModule: TestModule
      tests: TestCase[]
    }
  > = new Map()

  constructor(storage?: Storage) {
    this.storage = storage ?? new FileStorage()
  }

  onTestModuleCollected(testModule: TestModule): void {
    // Use moduleId as the identifier
    const moduleId = testModule.moduleId

    this.testModules.set(moduleId, {
      moduleId,
      testModule,
      tests: [],
    })
  }

  onTestCaseResult(testCase: TestCase): void {
    // Get the module id from the test case
    const moduleId = testCase.module.moduleId
    if (!moduleId) return

    const moduleData = this.testModules.get(moduleId)
    if (moduleData) {
      moduleData.tests.push(testCase)
    }
  }

  async onTestRunEnd(
    _testModules?: unknown,
    errors?: unknown,
    reason?: TestRunEndReason
  ): Promise<void> {
    const output = {
      testModules: Array.from(this.testModules.values()).map((moduleData) => ({
        moduleId: moduleData.moduleId,
        tests: moduleData.tests.map((testCase: TestCase) => {
          const result = testCase.result()
          return {
            name: testCase.name,
            fullName: testCase.fullName,
            state: result.state,
            errors: result.errors,
          }
        }),
      })),
      // Store unhandled errors - Error objects need special handling for JSON
      unhandledErrors:
        errors && Array.isArray(errors)
          ? errors.map((err) => {
              if (err instanceof Error) {
                // Error properties aren't enumerable, so we need to extract them explicitly
                return {
                  message: err.message,
                  stack: err.stack,
                  name: err.name,
                }
              }
              return err
            })
          : [],
      ...(reason && { reason }),
    }

    await this.storage.saveTest(JSON.stringify(output, null, 2))
  }
}
