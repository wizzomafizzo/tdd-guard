import type { Reporter, TestModule, TestCase } from 'vitest/node'
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
    this.storage = storage || new FileStorage()
  }

  onTestModuleCollected(testModule: TestModule) {
    // Use moduleId as the identifier
    const moduleId = testModule.moduleId

    this.testModules.set(moduleId, {
      moduleId,
      testModule,
      tests: [],
    })
  }

  onTestCaseResult(testCase: TestCase) {
    // Get the module id from the test case
    const moduleId = testCase.module.moduleId
    if (!moduleId) return

    const moduleData = this.testModules.get(moduleId)
    if (moduleData) {
      moduleData.tests.push(testCase)
    }
  }

  async onTestRunEnd() {
    const output = {
      testModules: Array.from(this.testModules.values()).map((moduleData) => ({
        moduleId: moduleData.moduleId,
        // Extract just the data we need from test cases
        tests: moduleData.tests.map((testCase: TestCase) => {
          const result = testCase.result()

          return {
            name: testCase.name,
            fullName: testCase.fullName,
            state: result?.state,
            errors: result?.errors,
          }
        }),
      })),
    }

    await this.storage.saveTest(JSON.stringify(output, null, 2))
  }
}
