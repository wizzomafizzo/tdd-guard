import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execSync } from 'node:child_process'
import { FileStorage, Config as TDDConfig } from 'tdd-guard'

describe('JestReporter E2E Integration', () => {
  let tempDir: string
  let storage: FileStorage

  beforeEach(() => {
    // Create a temporary directory for our test
    tempDir = mkdtempSync(join(tmpdir(), 'jest-reporter-e2e-'))

    // Create TDD Guard storage to read results
    const config = new TDDConfig({ projectRoot: tempDir })
    storage = new FileStorage(config)
  })

  afterEach(() => {
    // Clean up
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('captures test results when running Jest with JestReporter', async () => {
    // Create a simple test file similar to the vitest example
    const testFile = join(tempDir, 'simple-example.test.js')
    writeFileSync(
      testFile,
      `
describe('Simple Math', () => {
  test('adds two numbers', () => {
    expect(2 + 2).toBe(4);
  });

  test('multiplies two numbers', () => {
    expect(3 * 4).toBe(12);
  });
});
`
    )

    // Create Jest configuration that uses our reporter
    const jestConfig = join(tempDir, 'jest.config.js')
    writeFileSync(
      jestConfig,
      `
module.exports = {
  testMatch: ['**/*.test.js'],
  reporters: [
    'default',
    ['${join(__dirname, '..', '..', 'dist', 'index.js').replace(/\\/g, '/')}', {
      projectRoot: '${tempDir.replace(/\\/g, '/')}'
    }]
  ]
};
`
    )

    // Run Jest
    try {
      execSync('npx jest --no-cache', {
        cwd: tempDir,
        env: { ...process.env, CI: 'true' },
        stdio: 'pipe',
      })
    } catch (error: any) {
      // Jest might exit with non-zero if tests fail, but that's okay
      console.error('Jest execution error:', error.message)
    }

    // Check that results were saved
    const savedData = await storage.getTest()
    expect(savedData).toBeTruthy()

    // Parse the results
    const parsed = JSON.parse(savedData!)

    // Verify the structure matches expected format
    expect(parsed).toHaveProperty('testModules')
    expect(parsed).toHaveProperty('unhandledErrors')
    expect(parsed).toHaveProperty('reason')

    // Check test modules
    expect(parsed.testModules).toHaveLength(1)
    const module = parsed.testModules[0]
    expect(module.moduleId).toContain('simple-example.test.js')

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
    expect(parsed.unhandledErrors).toEqual([])
  })
})
