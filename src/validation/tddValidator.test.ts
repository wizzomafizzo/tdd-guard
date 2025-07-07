import { describe, test, expect } from 'vitest'
import { tddValidator } from './tddValidator'
import { Context } from '../contracts/types/Context'

describe('tddValidator', () => {
  test('returns violation when content contains two tests', () => {
    const context: Context = {
      edit: TestDataFactory.multipleTestEdits(),
    }

    const result = tddValidator(context)

    expect(result).toEqual({
      decision: 'block',
      reason: expect.any(String),
    })
  })

  test('does not block when adding single test', () => {
    const context: Context = {
      edit: TestDataFactory.singleTestEdit(),
    }

    const result = tddValidator(context)

    expect(result).toEqual({
      decision: undefined,
      reason: expect.any(String),
    })
  })

  test('returns violation when implementing more than necessary to make test pass', () => {
    const context: Context = {
      edit: TestDataFactory.excessiveEdit(),
      todo: TestDataFactory.relevantTodo(),
      test: TestDataFactory.correctTestFailure(),
    }

    const result = tddValidator(context)

    expect(result).toEqual({
      decision: 'block',
      reason: expect.any(String),
    })
  })

  test('allows stub creation to satisfy missing imports', () => {
    const context: Context = {
      edit: TestDataFactory.stubCreationEdit(),
      todo: TestDataFactory.calculatorTodo(),
      test: TestDataFactory.missingImportFailure(),
    }

    const result = tddValidator(context)

    expect(result).toEqual({
      decision: undefined,
      reason: expect.any(String),
    })
  })
})

// Test Data Factory
class TestDataFactory {
  static singleTestEdit(): string {
    return `  test('should divide two numbers correctly', () => {
    const result = calculator.divide(4, 2)
    expect(result).toBe(2)
  })`
  }

  static multipleTestEdits(): string {
    return `  test('should divide two numbers correctly', () => {
    const result = calculator.divide(4, 2)
    expect(result).toBe(2)
  })
  
  test('should handle division by zero', () => {
    expect(() => calculator.divide(4, 0)).toThrow('Cannot divide by zero')
  })`
  }

  static excessiveEdit(): string {
    return `  divide(a: number, b: number): number {
    // This is excessive - the test only needs division to work
    // Divide by zero handling should be a separate test
    if (b === 0) {
      throw new Error('Cannot divide by zero')
    }
    
    return a / b
  }`
  }

  static correctTestFailure(): string {
    return ` FAIL  src/Calculator.test.ts > Calculator > should divide two numbers correctly
AssertionError: expected 0 to be 2 // Object.is equality

- Expected
+ Received

- 2
+ 0

 ❯ src/Calculator.test.ts:25:20
     23|   test('should divide two numbers correctly', () => {
     24|     const result = calculator.divide(4, 2)
     25|     expect(result).toBe(2)
     26|   })
`
  }

  static relevantTodo(): string {
    return 'pending: Add divide method to Calculator class'
  }

  static stubCreationEdit(): string {
    return `export class Calculator {
  add(a: number, b: number): number {
    return 0
  }
}`
  }

  static calculatorTodo(): string {
    return 'in_progress: Create Calculator with addition method'
  }

  static missingImportFailure(): string {
    return ` FAIL  src/Calculator.test.ts
⨯ Unable to compile TypeScript:
src/Calculator.test.ts:1:10 - error TS2305: Module '"./Calculator"' has no exported member 'Calculator'.

1 import { Calculator } from './Calculator'
           ~~~~~~~~~~

Test Files  1 failed (1)
     Tests  no tests
      Time  1.23s (transform 823ms, setup 0ms, collect 0ms, tests 0ms, environment 0ms, prepare 0ms)`
  }
}
