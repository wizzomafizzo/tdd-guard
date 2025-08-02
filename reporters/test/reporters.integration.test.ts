import { describe, it, expect, beforeAll } from 'vitest'
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  copyFileSync,
  mkdirSync,
  symlinkSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { FileStorage, Config as TDDConfig } from 'tdd-guard'

// Test data structure for each reporter
interface ReporterTestData {
  name: string
  passingResults: unknown
  failingResults: unknown
  importErrorResults: unknown
}

describe('Reporters', () => {
  const reporterData: ReporterTestData[] = []

  // Run all reporters and collect their output before tests
  beforeAll(async () => {
    const reporters = [
      createJestReporter(),
      createVitestReporter(),
      createPhpunitReporter(),
    ]

    // Run all reporters in parallel
    const results = await Promise.all(reporters.map(runAllScenarios))
    reporterData.push(...results)
  }, 30000)

  describe('Module Path Reporting', () => {
    it('reports module path for passing assertions', () => {
      const moduleIds = extractValues('passingResults', extract.firstModuleId)

      expect(moduleIds.jest).toContain('single-passing.test.js')
      expect(moduleIds.vitest).toContain('single-passing.test.js')
      expect(moduleIds.phpunit).toContain('SinglePassingTest.php')
    })

    it('reports module path for failing assertions', () => {
      const moduleIds = extractValues('failingResults', extract.firstModuleId)

      expect(moduleIds.jest).toContain('single-failing.test.js')
      expect(moduleIds.vitest).toContain('single-failing.test.js')
      expect(moduleIds.phpunit).toContain('SingleFailingTest.php')
    })

    it('reports module path for import errors', () => {
      const results = extractValues('importErrorResults', extract.firstModuleId)

      expect(results.jest).toContain('single-import-error.test.js')
      expect(results.vitest).toContain('single-import-error.test.js')
      expect(results.phpunit).toContain('SingleImportErrorTest.php')
    })
  })

  describe('Test Name Reporting', () => {
    it('reports test names for passing test', () => {
      const testNames = extractValues('passingResults', extract.firstTestName)

      expect(testNames.jest).toBe('should add numbers correctly')
      expect(testNames.vitest).toBe('should add numbers correctly')
      expect(testNames.phpunit).toBe('testShouldAddNumbersCorrectly')
    })

    it('reports test names for failing test', () => {
      const testNames = extractValues('failingResults', extract.firstTestName)

      expect(testNames.jest).toBe('should add numbers correctly')
      expect(testNames.vitest).toBe('should add numbers correctly')
      expect(testNames.phpunit).toBe('testShouldAddNumbersCorrectly')
    })

    it('handles test names for import errors', () => {
      const results = extractValues('importErrorResults', extract.firstTestName)

      // Jest and Vitest don't have test names for import errors (tests array is empty)
      expect(results.jest).toBeUndefined()
      expect(results.vitest).toBeUndefined()
      // PHPUnit includes test data even for import errors
      expect(results.phpunit).toBe('testShouldAddNumbersCorrectly')
    })
  })

  describe('Full Test Name Reporting', () => {
    it('reports full test names for passing test', () => {
      const fullNames = extractValues(
        'passingResults',
        extract.firstTestFullName
      )

      expect(fullNames.jest).toBe('Calculator should add numbers correctly')
      expect(fullNames.vitest).toBe('Calculator > should add numbers correctly')
      expect(fullNames.phpunit).toBe(
        'SinglePassingTest::testShouldAddNumbersCorrectly'
      )
    })

    it('reports full test names for failing test', () => {
      const fullNames = extractValues(
        'failingResults',
        extract.firstTestFullName
      )

      expect(fullNames.jest).toBe('Calculator should add numbers correctly')
      expect(fullNames.vitest).toBe('Calculator > should add numbers correctly')
      expect(fullNames.phpunit).toBe(
        'SingleFailingTest::testShouldAddNumbersCorrectly'
      )
    })

    it('handles full test names for import errors', () => {
      const fullNames = extractValues(
        'importErrorResults',
        extract.firstTestFullName
      )

      // Jest and Vitest don't have test names for import errors
      expect(fullNames.jest).toBeUndefined()
      expect(fullNames.vitest).toBeUndefined()
      // PHPUnit includes test data even for import errors
      expect(fullNames.phpunit).toBe(
        'SingleImportErrorTest::testShouldAddNumbersCorrectly'
      )
    })
  })

  describe('Test State Reporting', () => {
    it('reports passing state for passing test', () => {
      const testStates = extractValues('passingResults', extract.firstTestState)

      expect(testStates.jest).toBe('passed')
      expect(testStates.vitest).toBe('passed')
      expect(testStates.phpunit).toBe('passed')
    })

    it('reports failing state for failing test', () => {
      const testStates = extractValues('failingResults', extract.firstTestState)

      expect(testStates.jest).toBe('failed')
      expect(testStates.vitest).toBe('failed')
      expect(testStates.phpunit).toBe('failed')
    })

    it('handles test state for import errors', () => {
      const testStates = extractValues(
        'importErrorResults',
        extract.firstTestState
      )

      // Jest and Vitest don't have test states for import errors
      expect(testStates.jest).toBeUndefined()
      expect(testStates.vitest).toBeUndefined()
      // PHPUnit reports failed state for import errors
      expect(testStates.phpunit).toBe('errored')
    })
  })

  describe('Error Message Reporting', () => {
    it('reports error messages in framework-specific formats', () => {
      const errorMessages = extractValues(
        'failingResults',
        extract.firstErrorMessage
      )

      expect(errorMessages.jest).toContain('Expected: 6')
      expect(errorMessages.jest).toContain('Received: 5')
      expect(errorMessages.vitest).toContain('expected 5 to be 6')
      expect(errorMessages.phpunit).toBe(
        'Failed asserting that 5 matches expected 6.'
      )
    })

    it('provides expected values when available', () => {
      const errors = extractValues('failingResults', extract.firstError)

      expect(errors.jest?.expected).toBe('6')
      expect(errors.vitest?.expected).toBe('6')
      expect(errors.phpunit?.expected).toBeUndefined()
    })

    it('provides actual values when available', () => {
      const errors = extractValues('failingResults', extract.firstError)

      expect(errors.jest?.actual).toBe('5')
      expect(errors.vitest?.actual).toBe('5')
      expect(errors.phpunit?.actual).toBeUndefined()
    })

    it('reports error messages for import errors', () => {
      const errorMessages = extractValues(
        'importErrorResults',
        extract.firstErrorMessage
      )

      // Jest and Vitest don't have error messages in test data for import errors
      expect(errorMessages.jest).toBeUndefined()
      expect(errorMessages.vitest).toBeUndefined()
      // PHPUnit includes the error message
      expect(errorMessages.phpunit).toContain('Class')
      expect(errorMessages.phpunit).toContain('not found')
    })
  })

  describe('Overall Test Run Status', () => {
    it('reports overall status as "passed" when all tests pass', () => {
      const reasons = extractValues('passingResults', extract.reason)

      expect(reasons.jest).toBe('passed')
      expect(reasons.vitest).toBe('passed')
      expect(reasons.phpunit).toBe('passed')
    })

    it('reports overall status as "failed" when any test fails', () => {
      const reasons = extractValues('failingResults', extract.reason)

      expect(reasons.jest).toBe('failed')
      expect(reasons.vitest).toBe('failed')
      expect(reasons.phpunit).toBe('failed')
    })

    it('reports overall status as "failed" when any import fails', () => {
      const reasons = extractValues('importErrorResults', extract.reason)

      expect(reasons.jest).toBe('failed')
      expect(reasons.vitest).toBe('failed')
      expect(reasons.phpunit).toBe('failed')
    })
  })

  // Helper to extract values from all reporters
  function extractValues<T>(
    scenario: 'passingResults' | 'failingResults' | 'importErrorResults',
    extractor: (data: unknown) => T
  ): { jest: T | undefined; vitest: T | undefined; phpunit: T | undefined } {
    const [jest, vitest, phpunit] = reporterData
    return {
      jest: safeExtract(jest[scenario], extractor),
      vitest: safeExtract(vitest[scenario], extractor),
      phpunit: safeExtract(phpunit[scenario], extractor),
    }
  }

  // Safely extract data with error handling
  function safeExtract<T>(
    data: unknown,
    extractor: (data: unknown) => T
  ): T | undefined {
    try {
      return extractor(data)
    } catch {
      return undefined
    }
  }

  // Type for test result data structure
  interface TestResultData {
    testModules: Array<{
      moduleId: string
      tests: Array<{
        name: string
        fullName: string
        state: string
        errors?: Array<{
          message: string
          expected?: string
          actual?: string
        }>
      }>
    }>
    reason: string
  }

  // Common test data extractors
  const extract = {
    firstModuleId: (data: unknown) =>
      (data as TestResultData).testModules[0].moduleId,
    firstTestName: (data: unknown) =>
      (data as TestResultData).testModules[0].tests[0].name,
    firstTestFullName: (data: unknown) =>
      (data as TestResultData).testModules[0].tests[0].fullName,
    firstTestState: (data: unknown) =>
      (data as TestResultData).testModules[0].tests[0].state,
    firstError: (data: unknown) =>
      (data as TestResultData).testModules[0].tests[0].errors?.[0],
    firstErrorMessage: (data: unknown) =>
      (data as TestResultData).testModules[0].tests[0].errors?.[0].message,
    reason: (data: unknown) => (data as TestResultData).reason,
  }
})

// Helper to run all test scenarios for a reporter
async function runAllScenarios(
  reporter: ReporterConfig
): Promise<ReporterTestData> {
  const [passingResults, failingResults, importErrorResults] =
    await Promise.all([
      runReporter(reporter, 'singlePassing'),
      runReporter(reporter, 'singleFailing'),
      runReporter(reporter, 'singleImportError'),
    ])

  return {
    name: reporter.name,
    passingResults,
    failingResults,
    importErrorResults,
  }
}

// Helper function to run a reporter and get results
async function runReporter(
  reporter: ReporterConfig,
  scenario: keyof TestScenarios
) {
  const tempDir = mkdtempSync(
    join(tmpdir(), `${reporter.name.toLowerCase()}-test-`)
  )

  try {
    // Create storage for reading test results
    const tddConfig = new TDDConfig({ projectRoot: tempDir })
    const storage = new FileStorage(tddConfig)

    // Create test framework configuration in temp directory
    const configPath = join(tempDir, reporter.configFileName)
    const reporterPath = join(__dirname, reporter.reporterPath).replace(
      /\\/g,
      '/'
    )
    writeFileSync(configPath, reporter.createConfig(tempDir, reporterPath))

    // Copy test file
    const filename = reporter.testScenarios[scenario]
    const sourcePath = join(
      __dirname,
      'artifacts',
      reporter.artifactDir,
      filename
    )
    const destPath = join(tempDir, filename)
    copyFileSync(sourcePath, destPath)

    // Run the test framework
    reporter.runCommand(tempDir, configPath, filename)

    // Get saved test data
    const savedData = await storage.getTest()
    return savedData ? JSON.parse(savedData) : null
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

// Configuration types
interface TestScenarios {
  singlePassing: string
  singleFailing: string
  singleImportError: string
}

interface ReporterConfig {
  name: string
  reporterPath: string
  configFileName: string
  artifactDir: string
  testScenarios: TestScenarios
  createConfig: (tempDir: string, reporterPath: string) => string
  runCommand: (
    tempDir: string,
    configPath: string,
    artifactPath: string
  ) => void
}

// Reporter factory functions
function createJestReporter(): ReporterConfig {
  return {
    name: 'JestReporter',
    reporterPath: '../jest/dist/index.js',
    configFileName: 'jest.config.js',
    artifactDir: 'jest',
    testScenarios: {
      singlePassing: 'single-passing.test.js',
      singleFailing: 'single-failing.test.js',
      singleImportError: 'single-import-error.test.js',
    },
    createConfig: (tempDir, reporterPath) => `
const path = require('path');

module.exports = {
  testMatch: ['**/*.test.js'],
  reporters: [
    'default',
    ['${reporterPath}', {
      projectRoot: '${tempDir}'
    }]
  ]
};
`,
    runCommand: (tempDir) => {
      const jestCliPath = require.resolve('jest-cli/bin/jest')
      spawnSync(process.execPath, [jestCliPath, '--no-cache'], {
        cwd: tempDir,
        env: { ...process.env, CI: 'true' },
        stdio: 'pipe',
      })
    },
  }
}

function createVitestReporter(): ReporterConfig {
  return {
    name: 'VitestReporter',
    reporterPath: '../vitest/dist/index.js',
    configFileName: 'vitest.config.js',
    artifactDir: 'vitest',
    testScenarios: {
      singlePassing: 'single-passing.test.js',
      singleFailing: 'single-failing.test.js',
      singleImportError: 'single-import-error.test.js',
    },
    createConfig: (tempDir, reporterPath) => `
export default {
  test: {
    reporters: [
      'default',
      ['${reporterPath}', '${tempDir}']
    ]
  }
};
`,
    runCommand: (tempDir) => {
      const vitestPath = require.resolve('vitest/vitest.mjs')
      spawnSync(process.execPath, [vitestPath, 'run', '--no-coverage'], {
        cwd: tempDir,
        env: { ...process.env, CI: 'true' },
        stdio: 'pipe',
      })
    },
  }
}

function createPhpunitReporter(): ReporterConfig {
  return {
    name: 'PHPUnitReporter',
    reporterPath: '../phpunit/src/TddGuardExtension.php',
    configFileName: 'phpunit.xml',
    artifactDir: 'phpunit',
    testScenarios: {
      singlePassing: 'SinglePassingTest.php',
      singleFailing: 'SingleFailingTest.php',
      singleImportError: 'SingleImportErrorTest.php',
    },
    createConfig: (tempDir) => `<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
         stopOnFailure="false">
    <testsuites>
        <testsuite name="Integration Tests">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    
    <extensions>
        <bootstrap class="TddGuard\\PHPUnit\\TddGuardExtension">
            <parameter name="projectRoot" value="${tempDir}"/>
        </bootstrap>
    </extensions>
</phpunit>
`,
    runCommand: (tempDir, configPath, artifactPath) => {
      // Create tests directory
      const testsDir = join(tempDir, 'tests')
      mkdirSync(testsDir, { recursive: true })

      // Copy test file to tests directory
      copyFileSync(join(tempDir, artifactPath), join(testsDir, artifactPath))

      // Create symlink to vendor directory
      const reporterVendorPath = join(__dirname, '../phpunit/vendor')
      const tempVendorPath = join(tempDir, 'vendor')
      symlinkSync(reporterVendorPath, tempVendorPath)

      // Run PHPUnit
      const phpunitPath = join(__dirname, '../phpunit/vendor/bin/phpunit')
      spawnSync(phpunitPath, ['-c', configPath], {
        cwd: tempDir,
        env: { ...process.env },
        stdio: 'pipe',
      })
    },
  }
}
