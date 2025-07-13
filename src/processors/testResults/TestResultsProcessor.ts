import {
  TestResultSchema,
  TestResult,
  isFailingTest,
  isPassingTest,
} from '../../contracts/schemas/vitestSchemas'

export class TestResultsProcessor {
  process(jsonData: string): string {
    const parseResult = this.parseAndValidate(jsonData)
    if (!parseResult.success) {
      return parseResult.error
    }

    const data = parseResult.data

    if (data.testModules.length === 0) {
      return 'No test results found.'
    }

    let failedCount = 0
    let passedCount = 0
    let failedModuleCount = 0
    let passedModuleCount = 0
    let output = ''

    // Count tests and modules
    for (const module of data.testModules) {
      let moduleHasFailures = false

      for (const test of module.tests) {
        if (isFailingTest(test)) {
          failedCount++
          moduleHasFailures = true
        } else if (isPassingTest(test)) {
          passedCount++
        }
      }

      if (moduleHasFailures) {
        failedModuleCount++
      } else {
        passedModuleCount++
      }
    }

    // Start output without RUN header

    // Show all modules
    for (const module of data.testModules) {
      const testCount = module.tests.length
      const failedTests = module.tests.filter(isFailingTest)

      if (failedTests.length === 0) {
        // All tests in this module passed
        output += ` ✓ ${module.moduleId} (${testCount} tests) 0ms\n`
      } else {
        // Some tests in this module failed
        output += ` ❯ ${module.moduleId} (${testCount} tests | ${failedTests.length} failed) 0ms\n`

        // Show individual test results for failing modules
        for (const test of module.tests) {
          if (isPassingTest(test)) {
            output += `   ✓ ${test.fullName} 0ms\n`
          } else if (isFailingTest(test)) {
            output += `   × ${test.fullName} 0ms\n`
            if (test.errors && test.errors.length > 0) {
              output += `     → ${test.errors[0].message}\n`
            }
          }
        }
      }
    }

    // Summary
    output += `\n`
    if (failedCount > 0) {
      if (passedCount > 0) {
        output += ` Test Files  ${failedModuleCount} failed | ${passedModuleCount} passed (${failedModuleCount + passedModuleCount})\n`
        output += `      Tests  ${failedCount} failed | ${passedCount} passed (${failedCount + passedCount})\n`
      } else {
        output += ` Test Files  ${failedModuleCount} failed (${failedModuleCount})\n`
        output += `      Tests  ${failedCount} failed (${failedCount})\n`
      }
    } else {
      output += ` Test Files  ${passedModuleCount} passed (${passedModuleCount})\n`
      output += `      Tests  ${passedCount} passed (${passedCount})\n`
    }

    return output
  }

  private parseAndValidate(
    jsonData: string
  ): { success: true; data: TestResult } | { success: false; error: string } {
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonData)
    } catch {
      return { success: false, error: 'Invalid JSON format.' }
    }

    const result = TestResultSchema.safeParse(parsed)
    if (!result.success) {
      // Handle the specific case of empty object which should show "No test results found"
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !('testModules' in parsed)
      ) {
        return { success: false, error: 'No test results found.' }
      }
      return { success: false, error: 'Invalid test result format.' }
    }

    return { success: true, data: result.data }
  }
}
