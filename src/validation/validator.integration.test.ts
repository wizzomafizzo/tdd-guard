import { describe, test, expect } from 'vitest'
import { validator } from './validator'
import { Context } from '../contracts/types/Context'

describe('validator', () => {
  test('returns violation when content contains two tests', async () => {
    const context: Context = {
      modifications: TestDataFactory.multipleTestEdits(),
    }

    const result = await validator(context)

    expect(result).toEqual({
      decision: 'block',
      reason: expect.any(String),
    })
  })

  test('does not block when adding single test', async () => {
    const context: Context = {
      modifications: TestDataFactory.singleTestEdit(),
    }

    const result = await validator(context)

    expect(result).toEqual({
      decision: undefined,
      reason: expect.any(String),
    })
  })

  test('returns violation when implementing more than necessary to make test pass', async () => {
    const context: Context = {
      modifications: TestDataFactory.excessiveEdit(),
      todo: TestDataFactory.relevantTodo(),
      test: TestDataFactory.correctTestFailure(),
    }

    const result = await validator(context)

    expect(result).toEqual({
      decision: 'block',
      reason: expect.any(String),
    })
  })

  test('allows stub creation to satisfy missing imports', async () => {
    const context: Context = {
      modifications: TestDataFactory.stubCreationEdit(),
      todo: TestDataFactory.calculatorTodo(),
      test: TestDataFactory.missingImportFailure(),
    }

    const result = await validator(context)

    expect(result).toEqual({
      decision: undefined,
      reason: expect.any(String),
    })
  })

  test('does not block when old_string contains one of two tests in new_string', async () => {
    const context: Context = {
      modifications: TestDataFactory.editWithExistingTest(),
      todo: TestDataFactory.addDivideMethodTodo(),
      test: TestDataFactory.passingTests(),
    }

    const result = await validator(context)

    expect(result).toEqual({
      decision: undefined,
      reason: expect.any(String),
    })
  })

  test('does not block refactoring tests with MultiEdit', async () => {
    const context: Context = {
      modifications: TestDataFactory.batchEditFormat(),
      todo: TestDataFactory.refactoringTodo(),
      test: TestDataFactory.allTestsPassing(),
    }

    const result = await validator(context)

    expect(result).toEqual({
      decision: undefined,
      reason: expect.any(String),
    })
  })
})

// Test Data Factory
class TestDataFactory {
  static singleTestEdit(): string {
    // This represents a Write operation with a single test
    return JSON.stringify({
      tool_name: 'Write',
      session_id: 'test-session',
      transcript_path: '/test/transcript',
      hook_event_name: 'tool_use',
      tool_input: {
        file_path: '/src/Calculator.test.ts',
        content: `describe('Calculator', () => {
  test('should divide two numbers correctly', () => {
    const result = calculator.divide(4, 2)
    expect(result).toBe(2)
  })
})`,
      },
    })
  }

  static multipleTestEdits(): string {
    // This represents a Write operation with multiple tests
    return JSON.stringify({
      tool_name: 'Write',
      session_id: 'test-session',
      transcript_path: '/test/transcript',
      hook_event_name: 'tool_use',
      tool_input: {
        file_path: '/src/Calculator.test.ts',
        content: `describe('Calculator', () => {
  test('should divide two numbers correctly', () => {
    const result = calculator.divide(4, 2)
    expect(result).toBe(2)
  })
  
  test('should handle division by zero', () => {
    expect(() => calculator.divide(4, 0)).toThrow('Cannot divide by zero')
  })
})`,
      },
    })
  }

  static excessiveEdit(): string {
    return JSON.stringify({
      tool_name: 'Edit',
      session_id: 'test-session',
      transcript_path: '/test/transcript',
      hook_event_name: 'tool_use',
      tool_input: {
        file_path: '/src/Calculator.ts',
        old_string:
          '  divide(a: number, b: number): number {\n    return 0\n  }',
        new_string: `  divide(a: number, b: number): number {
    // This is excessive - the test only needs division to work
    // Divide by zero handling should be a separate test
    if (b === 0) {
      throw new Error('Cannot divide by zero')
    }
    
    return a / b
  }`,
      },
    })
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
    return JSON.stringify([
      {
        content: 'Add divide method to Calculator class',
        status: 'pending',
        priority: 'high',
        id: '1',
      },
    ])
  }

  static stubCreationEdit(): string {
    return JSON.stringify({
      tool_name: 'Write',
      session_id: 'test-session',
      transcript_path: '/test/transcript',
      hook_event_name: 'tool_use',
      tool_input: {
        file_path: '/src/Calculator.ts',
        content: `export class Calculator {
  add(a: number, b: number): number {
    return 0
  }
}`,
      },
    })
  }

  static calculatorTodo(): string {
    return JSON.stringify([
      {
        content: 'Create Calculator with addition method',
        status: 'in_progress',
        priority: 'high',
        id: '1',
      },
    ])
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

  static editWithExistingTest(): string {
    return JSON.stringify({
      tool_name: 'Edit',
      session_id: 'test-session',
      transcript_path: '/test/transcript',
      hook_event_name: 'tool_use',
      tool_input: {
        file_path: '/src/Calculator.test.ts',
        old_string: `describe('Calculator', () => {
  test('should add two numbers correctly', () => {
    const result = calculator.add(2, 3)
    expect(result).toBe(5)
  })
})`,
        new_string: `describe('Calculator', () => {
  test('should add two numbers correctly', () => {
    const result = calculator.add(2, 3)
    expect(result).toBe(5)
  })
  
  test('should divide two numbers correctly', () => {
    const result = calculator.divide(4, 2)
    expect(result).toBe(2)
  })
})`,
      },
    })
  }

  static addDivideMethodTodo(): string {
    return JSON.stringify([
      {
        content: 'Create add method for Calculator class',
        status: 'completed',
        priority: 'high',
        id: '1',
      },
      {
        content: 'Create divide method for Calculator class',
        status: 'in_progress',
        priority: 'high',
        id: '2',
      },
    ])
  }

  static passingTests(): string {
    return ` PASS  src/Calculator.test.ts
  ✓ Calculator > should add two numbers correctly (2ms)

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  14:23:45
   Duration  215ms`
  }

  static batchEditFormat(): string {
    return JSON.stringify({
      tool_name: 'MultiEdit',
      session_id: 'test-session',
      transcript_path: '/test/transcript',
      hook_event_name: 'tool_use',
      tool_input: {
        file_path: '/test/Clock.test.ts',
        edits: [
          {
            old_string:
              '    const clock = new Clock()\n    clock.setTime(14, 30, 45)',
            new_string: '    const clock = createClockWithTime(14, 30, 45)',
          },
          {
            old_string:
              '    const clock = new Clock()\n    clock.setTime(23, 59, 59)',
            new_string: '    const clock = createClockWithTime(23, 59, 59)',
          },
          {
            old_string:
              '    const clock = new Clock()\n    clock.setTime(0, 0, 0)',
            new_string: '    const clock = createClockWithTime(0, 0, 0)',
          },
        ],
      },
    })
  }

  static refactoringTodo(): string {
    return JSON.stringify([
      {
        content: 'Implement Clock class with setTime method',
        status: 'completed',
        priority: 'high',
        id: '1',
      },
      {
        content: 'Add display method to Clock',
        status: 'completed',
        priority: 'high',
        id: '2',
      },
      {
        content: 'Refactor test setup to use helper function',
        status: 'in_progress',
        priority: 'medium',
        id: '3',
      },
    ])
  }

  static allTestsPassing(): string {
    return ` PASS  test/Clock.test.ts
  ✓ Clock > should display time in HH:MM:SS format (2ms)
  ✓ Clock > should handle edge case at midnight (1ms)
  ✓ Clock > should handle edge case before midnight (1ms)

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  14:23:45
   Duration  215ms`
  }
}
