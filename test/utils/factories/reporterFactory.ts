import type { TestModule, TestCase, TestResult } from 'vitest/node'

// Minimal module - only moduleId is used by JSONReporter
const defaultModule: TestModule = {
  moduleId: '/test/example.test.ts',
} as TestModule

// Minimal test case base
const defaultTestCase: TestCase = {
  name: 'should pass',
  fullName: 'Example Suite > should pass',
  module: defaultModule,
  result: () =>
    ({
      state: 'passed',
      errors: [],
    }) as TestResult,
} as TestCase

export function testModule(overrides?: Partial<TestModule>): TestModule {
  return {
    ...defaultModule,
    ...overrides,
  } as TestModule
}

export function passedTestCase(overrides?: Partial<TestCase>): TestCase {
  return {
    ...defaultTestCase,
    ...overrides,
  } as TestCase
}

export function failedTestCase(overrides?: Partial<TestCase>): TestCase {
  return {
    ...defaultTestCase,
    name: 'should fail',
    fullName: 'Example Suite > should fail',
    result: () =>
      ({
        state: 'failed',
        errors: [
          {
            message: 'expected 2 to be 3',
            stack: 'Error: expected 2 to be 3\n    at test.ts:7:19',
            expected: '3',
            actual: '2',
          },
        ],
      }) as TestResult,
    ...overrides,
  } as TestCase
}
