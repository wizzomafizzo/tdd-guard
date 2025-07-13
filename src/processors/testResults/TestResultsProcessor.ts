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

    const counts = this.countTestsAndModules(data)
    const moduleOutput = this.formatModules(data)
    const summaryOutput = this.formatSummary(counts)

    return `${moduleOutput}\n${summaryOutput}`
  }

  private countTestsAndModules(data: TestResult): {
    failedCount: number
    passedCount: number
    failedModuleCount: number
    passedModuleCount: number
  } {
    let failedCount = 0
    let passedCount = 0
    let failedModuleCount = 0
    let passedModuleCount = 0

    for (const module of data.testModules) {
      const moduleCounts = this.countModuleTests(module.tests)

      failedCount += moduleCounts.failed
      passedCount += moduleCounts.passed

      if (moduleCounts.failed > 0) {
        failedModuleCount++
      } else {
        passedModuleCount++
      }
    }

    return { failedCount, passedCount, failedModuleCount, passedModuleCount }
  }

  private countModuleTests(tests: TestResult['testModules'][0]['tests']): {
    failed: number
    passed: number
  } {
    let failed = 0
    let passed = 0

    for (const test of tests) {
      if (isFailingTest(test)) {
        failed++
      } else if (isPassingTest(test)) {
        passed++
      }
    }

    return { failed, passed }
  }

  private formatModules(data: TestResult): string {
    let output = ''

    for (const module of data.testModules) {
      const testCount = module.tests.length
      const failedTests = module.tests.filter(isFailingTest)

      if (failedTests.length === 0) {
        output += ` ✓ ${module.moduleId} (${testCount} tests) 0ms\n`
      } else {
        output += ` ❯ ${module.moduleId} (${testCount} tests | ${failedTests.length} failed) 0ms\n`
        output += this.formatFailingModuleTests(module.tests)
      }
    }

    return output
  }

  private formatFailingModuleTests(
    tests: TestResult['testModules'][0]['tests']
  ): string {
    let output = ''

    for (const test of tests) {
      output += this.formatSingleTest(test)
    }

    return output
  }

  private formatSingleTest(
    test: TestResult['testModules'][0]['tests'][0]
  ): string {
    if (isPassingTest(test)) {
      return `   ✓ ${test.fullName} 0ms\n`
    }

    if (isFailingTest(test)) {
      return this.formatFailingTest(test)
    }

    return ''
  }

  private formatFailingTest(
    test: TestResult['testModules'][0]['tests'][0]
  ): string {
    let output = `   × ${test.fullName} 0ms\n`

    if (test.errors && test.errors.length > 0) {
      output += `     → ${test.errors[0].message}\n`
    }

    return output
  }

  private formatSummary(counts: {
    failedCount: number
    passedCount: number
    failedModuleCount: number
    passedModuleCount: number
  }): string {
    const { failedCount, passedCount, failedModuleCount, passedModuleCount } =
      counts
    let output = ''

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
    const parsed = this.parseJson(jsonData)
    if (!parsed.success) {
      return parsed
    }

    const result = TestResultSchema.safeParse(parsed.data)
    if (!result.success) {
      return { success: false, error: this.getValidationError(parsed.data) }
    }

    return { success: true, data: result.data }
  }

  private parseJson(
    jsonData: string
  ): { success: true; data: unknown } | { success: false; error: string } {
    try {
      const data = JSON.parse(jsonData)
      return { success: true, data }
    } catch {
      return { success: false, error: 'Invalid JSON format.' }
    }
  }

  private getValidationError(parsed: unknown): string {
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !('testModules' in parsed)
    ) {
      return 'No test results found.'
    }
    return 'Invalid test result format.'
  }
}
