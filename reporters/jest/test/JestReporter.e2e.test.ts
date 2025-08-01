import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { FileStorage, Config as TDDConfig } from 'tdd-guard'

describe('JestReporter e2e', () => {
  let sut: ReturnType<typeof setupJestReporter>

  beforeEach(() => {
    sut = setupJestReporter()
  })

  afterEach(() => {
    sut.cleanup()
  })

  it('captures passing test results', async () => {
    // Run Jest with the passing tests artifact
    const parsed = await sut.runJest('passing-tests.test.js')

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
    expect(test1.fullName).toBe('Simple Math adds two numbers')
    expect(test1.state).toBe('passed')

    const test2 = module.tests[1]
    expect(test2.name).toBe('multiplies two numbers')
    expect(test2.fullName).toBe('Simple Math multiplies two numbers')
    expect(test2.state).toBe('passed')

    // Check overall status
    expect(parsed.reason).toBe('passed')
  })

  it('captures failing assertion results', async () => {
    // Run Jest with the failing assertion artifact
    const parsed = await sut.runJest('failing-assertion.test.js')

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
    expect(test1.fullName).toBe('Simple Math adds two numbers')
    expect(test1.state).toBe('passed')

    const test2 = module.tests[1]
    expect(test2.name).toBe('multiplies two numbers')
    expect(test2.fullName).toBe('Simple Math multiplies two numbers')
    expect(test2.state).toBe('failed')
    expect(test2.errors).toBeTruthy()
    expect(test2.errors).toHaveLength(1)

    const error = test2.errors[0]
    expect(error.message).toContain('Expected: 10')
    expect(error.message).toContain('Received: 12')
    expect(error.stack).toBeTruthy()
    expect(error.expected).toBe('10')
    expect(error.actual).toBe('12')

    // Check overall status
    expect(parsed.reason).toBe('failed')
  })
})

// Test setup helper function
function setupJestReporter() {
  const tempDir = mkdtempSync(join(tmpdir(), 'jest-reporter-'))

  // Create storage for reading test results
  const config = new TDDConfig({ projectRoot: tempDir })
  const storage = new FileStorage(config)

  // Create Jest configuration in temp directory
  const jestConfig = join(tempDir, 'jest.config.js')
  writeFileSync(
    jestConfig,
    `
const path = require('path');

module.exports = {
  testMatch: ['**/*.test.js'],
  reporters: [
    'default',
    ['${join(__dirname, '..', 'dist', 'index.js').replace(/\\/g, '/')}', {
      projectRoot: '${tempDir.replace(/\\/g, '/')}'
    }]
  ]
};
`
  )

  // Method to copy artifact to temp directory
  const copyArtifact = (artifactName: string) => {
    const testFile = join(tempDir, artifactName)
    copyFileSync(join(__dirname, 'artifacts', artifactName), testFile)
  }

  // Method to run Jest and return parsed test data
  const runJest = async (artifactName: string) => {
    // Copy the artifact first
    copyArtifact(artifactName)

    // Run Jest - it may exit with non-zero code on test failures
    const jestCliPath = require.resolve('jest-cli/bin/jest')
    spawnSync(process.execPath, [jestCliPath, '--no-cache'], {
      cwd: tempDir,
      env: { ...process.env, CI: 'true' },
      stdio: 'pipe',
    })

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
    runJest,
    cleanup,
  }
}
