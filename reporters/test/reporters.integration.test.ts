import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { FileStorage, Config as TDDConfig } from 'tdd-guard'

describe('Reporters integration tests', () => {
  const reporters: ReporterConfig[] = [
    createJestReporter(),
    createVitestReporter(),
  ]

  reporters.forEach((reporter) => {
    describe(`${reporter.name} integration`, () => {
      let sut: ReturnType<typeof setupReporter>

      beforeEach(() => {
        sut = setupReporter(reporter)
      })

      afterEach(() => {
        sut.cleanup()
      })

      it('captures passing test results', async () => {
        // Two simple passing tests
        const parsed = await sut.run('passing')

        // Verify results were saved
        expect(parsed).toBeTruthy()

        // Verify structure
        expect(parsed).toHaveProperty('testModules')
        expect(parsed).toHaveProperty('reason')

        // Check test modules
        expect(parsed.testModules).toHaveLength(1)
        const module = parsed.testModules[0]
        expect(module.moduleId).toContain('passing-tests.test.js')

        // Check tests
        expect(module.tests).toHaveLength(2)

        const test1 = module.tests[0]
        expect(test1.name).toBe('adds two numbers')
        expect(test1.fullName).toContain('Simple Math')
        expect(test1.fullName).toContain('adds two numbers')
        expect(test1.state).toBe('passed')

        const test2 = module.tests[1]
        expect(test2.name).toBe('multiplies two numbers')
        expect(test2.fullName).toContain('Simple Math')
        expect(test2.fullName).toContain('multiplies two numbers')
        expect(test2.state).toBe('passed')

        // Check overall status
        expect(parsed.reason).toBe('passed')
      })

      it('captures failing assertion results', async () => {
        // A passing and a failing test
        const parsed = await sut.run('failingAssertion')

        // Verify results were saved
        expect(parsed).toBeTruthy()

        // Verify structure
        expect(parsed).toHaveProperty('testModules')
        expect(parsed).toHaveProperty('reason')

        // Check test modules
        expect(parsed.testModules).toHaveLength(1)
        const module = parsed.testModules[0]
        expect(module.moduleId).toContain('failing-assertion.test.js')

        // Check tests
        expect(module.tests).toHaveLength(2)

        const test1 = module.tests[0]
        expect(test1.name).toBe('adds two numbers')
        expect(test1.fullName).toContain('Simple Math')
        expect(test1.fullName).toContain('adds two numbers')
        expect(test1.state).toBe('passed')

        const test2 = module.tests[1]
        expect(test2.name).toBe('multiplies two numbers')
        expect(test2.fullName).toContain('Simple Math')
        expect(test2.fullName).toContain('multiplies two numbers')
        expect(test2.state).toBe('failed')
        expect(test2.errors).toBeTruthy()
        expect(test2.errors).toHaveLength(1)

        const error = test2.errors[0]
        // Test that error message contains the relevant numbers
        expect(error.message).toContain('10')
        expect(error.message).toContain('12')
        expect(error.stack).toBeTruthy()
        expect(error.expected).toBe('10')
        expect(error.actual).toBe('12')

        // Check overall status
        expect(parsed.reason).toBe('failed')
      })
    })
  })
})

// Test setup helpers
function setupReporter(reporter: ReporterConfig) {
  const tempDir = mkdtempSync(
    join(tmpdir(), `${reporter.name.toLowerCase()}-reporter-`)
  )

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

  // Method to copy artifact to temp directory
  const copyArtifact = (scenario: keyof TestScenarios) => {
    const filename = reporter.testScenarios[scenario]
    const sourcePath = join(
      __dirname,
      'artifacts',
      reporter.artifactDir,
      filename
    )
    const destPath = join(tempDir, filename)
    copyFileSync(sourcePath, destPath)
  }

  // Method to run tests and return parsed test data
  const run = async (scenario: keyof TestScenarios) => {
    // Copy the artifact first
    copyArtifact(scenario)

    // Run the test framework
    const filename = reporter.testScenarios[scenario]
    reporter.runCommand(tempDir, configPath, filename)

    const savedData = await storage.getTest()
    return savedData ? JSON.parse(savedData) : null
  }

  // Cleanup function
  const cleanup = () => {
    rmSync(tempDir, { recursive: true, force: true })
  }

  return {
    tempDir,
    storage,
    copyArtifact,
    run,
    cleanup,
  }
}

// Configuration types and data
interface TestScenarios {
  passing: string
  failingAssertion: string
}

interface ReporterConfig {
  name: string
  reporterPath: string // Path to the reporter module
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
      passing: 'passing-tests.test.js',
      failingAssertion: 'failing-assertion.test.js',
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
      passing: 'passing-tests.test.js',
      failingAssertion: 'failing-assertion.test.js',
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
