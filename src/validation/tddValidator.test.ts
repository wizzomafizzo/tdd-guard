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
}
