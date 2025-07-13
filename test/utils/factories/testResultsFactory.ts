import type {
  TestError,
  Test,
  TestModule,
  TestResult,
} from '../../../src/contracts/schemas/vitestSchemas'

// Base builders
export function createTestError(overrides: Partial<TestError> = {}): TestError {
  return {
    message: 'expected value to be different',
    stack: 'Error: expected value to be different\n    at test.ts:10:5',
    ...overrides,
  }
}

export function createTest(overrides: Partial<Test> = {}): Test {
  return {
    name: 'should work',
    fullName: 'Suite > should work',
    state: 'passed',
    ...overrides,
  }
}

export function createTestModule(
  overrides: Partial<TestModule> = {}
): TestModule {
  return {
    moduleId: '/src/example.test.ts',
    tests: [],
    ...overrides,
  }
}

export function createTestResults(
  overrides: Partial<TestResult> = {}
): TestResult {
  return {
    testModules: [],
    ...overrides,
  }
}

// Specific test data factories
export function emptyTestResults(): TestResult {
  return createTestResults()
}

export function failedTestResults(): TestResult {
  return createTestResults({
    testModules: [
      createTestModule({
        tests: [
          createTest({
            name: 'should calculate sum',
            fullName: 'Calculator > should calculate sum',
            state: 'failed',
            errors: [
              createTestError({
                message: 'expected 5 to be 6',
                stack: 'Error: expected 5 to be 6\n    at example.test.ts:10:5',
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

export function passingTestResults(): TestResult {
  return createTestResults({
    testModules: [
      createTestModule({
        tests: [
          createTest({
            name: 'should add numbers',
            fullName: 'Calculator > should add numbers',
            state: 'passed',
          }),
          createTest({
            name: 'should subtract numbers',
            fullName: 'Calculator > should subtract numbers',
            state: 'passed',
          }),
        ],
      }),
    ],
  })
}

export function multipleFailedTestResults(): TestResult {
  return createTestResults({
    testModules: [
      createTestModule({
        moduleId: '/src/calculator.test.ts',
        tests: [
          createTest({
            name: 'should add two numbers',
            fullName: 'Calculator > should add two numbers',
            state: 'failed',
            errors: [
              createTestError({
                message: 'expected 5 to be 6',
                stack:
                  'Error: expected 5 to be 6\n    at calculator.test.ts:10:5',
              }),
            ],
          }),
          createTest({
            name: 'should multiply two numbers',
            fullName: 'Calculator > should multiply two numbers',
            state: 'failed',
            errors: [
              createTestError({
                message: 'expected 12 to be 15',
                stack:
                  'Error: expected 12 to be 15\n    at calculator.test.ts:15:5',
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

export function mixedTestResults(): TestResult {
  return createTestResults({
    testModules: [
      createTestModule({
        moduleId: '/src/calculator.test.ts',
        tests: [
          createTest({
            name: 'should add two numbers',
            fullName: 'Calculator > should add two numbers',
            state: 'passed',
          }),
          createTest({
            name: 'should multiply two numbers',
            fullName: 'Calculator > should multiply two numbers',
            state: 'failed',
            errors: [
              createTestError({
                message: 'expected 12 to be 15',
                stack:
                  'Error: expected 12 to be 15\n    at calculator.test.ts:15:5',
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

export function multipleModulesTestResults(): TestResult {
  return createTestResults({
    testModules: [
      createTestModule({
        moduleId: '/src/calculator.test.ts',
        tests: [
          createTest({
            name: 'should add two numbers',
            fullName: 'Calculator > should add two numbers',
            state: 'passed',
          }),
          createTest({
            name: 'should multiply two numbers',
            fullName: 'Calculator > should multiply two numbers',
            state: 'failed',
            errors: [
              createTestError({
                message: 'expected 12 to be 15',
                stack:
                  'Error: expected 12 to be 15\n    at calculator.test.ts:15:5',
              }),
            ],
          }),
        ],
      }),
      createTestModule({
        moduleId: '/src/utils/formatter.test.ts',
        tests: [
          createTest({
            name: 'should format currency',
            fullName: 'Formatter > should format currency',
            state: 'passed',
          }),
          createTest({
            name: 'should format date',
            fullName: 'Formatter > should format date',
            state: 'failed',
            errors: [
              createTestError({
                message: 'expected "2024-01-01" to be "01/01/2024"',
                stack:
                  'Error: expected "2024-01-01" to be "01/01/2024"\n    at formatter.test.ts:20:5',
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
