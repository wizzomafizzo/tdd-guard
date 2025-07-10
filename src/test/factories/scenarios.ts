// Todo data structures
export interface TodoItem {
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
  id: string
}

export interface TestData<T = string> {
  description: string
  content: T
}

// Test results
export const testResults = {
  notDefined: {
    description: 'not defined error',
    content: `
 ❯ src/Calculator/Calculator.test.ts (1 test | 1 failed) 3ms
   × Calculator > it adds two numbers 2ms
     → Calculator is not defined

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  19:25:41
   Duration  273ms (transform 19ms, setup 0ms, collect 12ms, tests 3ms, environment 0ms, prepare 49ms)
`,
  },
  notAConstructor: {
    description: 'not a constructor error',
    content: `
 ❯ src/Calculator/Calculator.test.ts (1 test | 1 failed) 3ms
   × Calculator > it adds two numbers 2ms
     → Calculator is not a constructor

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  19:56:52
   Duration  289ms (transform 22ms, setup 0ms, collect 16ms, tests 3ms, environment 0ms, prepare 44ms)
`,
  },
  notAFunction: {
    description: 'not a function error',
    content: `
 ❯ src/Calculator/Calculator.test.ts (1 test | 1 failed) 3ms
   × Calculator > it adds two numbers 2ms
     → calculator.add is not a function

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  19:58:00
   Duration  303ms (transform 22ms, setup 0ms, collect 16ms, tests 3ms, environment 0ms, prepare 55ms)
`,
  },
  assertionError: {
    description: 'assertion failure',
    content: `
 ❯ src/Calculator/Calculator.test.ts (1 test | 1 failed) 4ms
   × Calculator > it adds two numbers 4ms
     → expected +0 to be 4 // Object.is equality

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  19:59:48
   Duration  298ms (transform 26ms, setup 0ms, collect 16ms, tests 4ms, environment 0ms, prepare 46ms)
`,
  },
  passing: {
    description: 'passing tests',
    content: `
 ✓ src/Calculator/Calculator.test.ts (1 test) 1ms
   ✓ Calculator > it adds two numbers 1ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  20:00:50
   Duration  298ms (transform 21ms, setup 0ms, collect 16ms, tests 1ms, environment 0ms, prepare 56ms)
`,
  },
  irrelevant: {
    description: 'irrelevant tests',
    content: `
 ✓ src/Billing/Domestic.test.ts (1 test) 1ms
   ✓ DomesticBilling > it generates xml report 1ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  20:00:50
   Duration  298ms (transform 21ms, setup 0ms, collect 16ms, tests 1ms, environment 0ms, prepare 56ms)
`,
  },
  empty: {
    description: 'no test output',
    content: ``,
  },
} as const

// Test modifications
export const testModifications = {
  singleTest: {
    description: 'adding a single test',
    content: `
  test('it adds two numbers', () => {
    const calculator = new Calculator();
    const result = calculator.add(2, 2);
    expect(result).toBe(4);
  })
`,
  },
  multipleTests: {
    description: 'adding multiple tests',
    content: `
  test('it adds two numbers', () => {
    const calculator = new Calculator();
    const result = calculator.add(2, 2);
    expect(result).toBe(4);
  })

  test('it subtracts two numbers', () => {
    const calculator = new Calculator();
    const result = calculator.subtract(8, 2);
    expect(result).toBe(6);
  })
`,
  },
  multipleTestsWithImports: {
    description: 'adding multiple tests with imports',
    content: `
import { describe, test, expect } from 'vitest'
import { Calculator } from './Calculator'

describe('Calculator', () => {
  test('it adds two numbers', () => {
    const calculator = new Calculator();
    const result = calculator.add(2, 2);
    expect(result).toBe(4);
  })

  test('it subtracts two numbers', () => {
    const calculator = new Calculator();
    const result = calculator.subtract(8, 2);
    expect(result).toBe(6);
  })
})
`,
  },
  singleTestWithDescribe: {
    description: 'adding a single test with describe block',
    content: `
describe('Calculator', () => {
  test('it adds two numbers', () => {
    const calculator = new Calculator();
    const result = calculator.add(2, 2);
    expect(result).toBe(4);
  })
})
`,
  },
  singleTestComplete: {
    description: 'adding a complete test file',
    content: `
import { describe, test, expect } from 'vitest'
import { Calculator } from './Calculator'

describe('Calculator', () => {
  test('it adds two numbers', () => {
    const calculator = new Calculator();
    const result = calculator.add(2, 2);
    expect(result).toBe(4);
  })
})
`,
  },
  emptyDescribe: {
    description: 'empty describe block',
    content: `
describe('Calculator', () => {

})
`,
  },
  emptyDescribeWithImports: {
    description: 'empty test file with imports',
    content: `
import { describe, test, expect } from 'vitest'
import { Calculator } from './Calculator'

describe('Calculator', () => {

})
`,
  },
  refactoredTests: {
    description: 'refactoring test setup',
    content: `
  const calculator = new Calculator();

  test('it adds two numbers', () => {
    const result = calculator.add(2, 2);
    expect(result).toBe(4);
  })

  test('it subtracts two numbers', () => {
    const result = calculator.subtract(8, 2);
    expect(result).toBe(6);
  })
`,
  },
} as const

// Implementation modifications
export const implementationModifications = {
  empty: {
    description: 'class file with only a comment',
    content: `// Calculator.ts
`,
  },
  classStub: {
    description: 'creating empty class stub',
    content: `
export class Calculator {}
`,
  },
  methodStub: {
    description: 'creating method stub',
    content: `
export class Calculator {
  add(a: number, b: number) {
    return undefined;
  }
}
`,
  },
  methodStubReturning0: {
    description: 'method stub returning 0',
    content: `
export class Calculator {
  add(a: number, b: number): number {
    return 0;
  }
}
`,
  },
  methodImplementation: {
    description: 'implementing method',
    content: `
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}
`,
  },
  overEngineered: {
    description: 'over-engineering implementation',
    content:
      String.raw`
import { Logger } from '../utils/Logger';
import { MetricsCollector } from '../utils/MetricsCollector';
import { ValidationService } from '../services/ValidationService';

export class Calculator {
  private logger: Logger;
  private metrics: MetricsCollector;
  private validationService: ValidationService;

  constructor() {
    this.logger = new Logger('Calculator');
    this.metrics = new MetricsCollector();
    this.validationService = new ValidationService();
  }

  add(a: number, b: number): number {
    this.logger.debug(` +
      '`' +
      `Adding \${a} + \${b}` +
      '`' +
      `);
    
    // Validate inputs
    if (!this.validationService.isValidNumber(a)) {
      this.logger.error(` +
      '`' +
      `Invalid input: \${a}` +
      '`' +
      `);
      throw new Error('First argument must be a valid number');
    }
    if (!this.validationService.isValidNumber(b)) {
      this.logger.error(` +
      '`' +
      `Invalid input: \${b}` +
      '`' +
      `);
      throw new Error('Second argument must be a valid number');
    }
    
    // Track metrics
    const startTime = performance.now();
    this.metrics.incrementCounter('add_operations');
    
    // Perform calculation
    const result = a + b;
    
    // More tracking
    const endTime = performance.now();
    this.metrics.recordTiming('add_operation_duration', endTime - startTime);
    
    // Log result
    this.logger.info(` +
      '`' +
      `Addition result: \${result}` +
      '`' +
      `);
    
    // Check for overflow
    if (!Number.isFinite(result)) {
      this.logger.warn('Result exceeded maximum safe integer');
    }
    
    return result;
  }
}
`,
  },
  completeClass: {
    description: 'implementing multiple methods',
    content: String.raw`
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
}
`,
  },
} as const

// Todo states
export const todos = {
  empty: {
    description: 'no todos',
    content: [] as TodoItem[],
  },
  irrelevantCompleted: {
    description: 'irrelevant completed todos',
    content: [
      {
        content: 'Add support for domestic billing',
        status: 'completed',
        priority: 'high',
        id: '1',
      },
      {
        content: 'Generate XML report tags',
        status: 'completed',
        priority: 'high',
        id: '2',
      },
      {
        content: 'Update billing wiki',
        status: 'completed',
        priority: 'high',
        id: '3',
      },
    ] as TodoItem[],
  },
  irrelevantInProgress: {
    description: 'irrelevant task in progress',
    content: [
      {
        content: 'Add support for domestic billing',
        status: 'completed',
        priority: 'high',
        id: '1',
      },
      {
        content: 'Generate XML report tags',
        status: 'in_progress',
        priority: 'high',
        id: '2',
      },
      {
        content: 'Update billing wiki',
        status: 'pending',
        priority: 'high',
        id: '3',
      },
    ] as TodoItem[],
  },
  classInProgress: {
    description: 'class in progress',
    content: [
      {
        content: 'Add Calculator class',
        status: 'in_progress',
        priority: 'high',
        id: '1',
      },
      {
        content: 'Create add method',
        status: 'pending',
        priority: 'high',
        id: '2',
      },
      {
        content: 'Create subtract method',
        status: 'pending',
        priority: 'high',
        id: '3',
      },
    ] as TodoItem[],
  },
  methodInProgress: {
    description: 'method in progress',
    content: [
      {
        content: 'Add Calculator class',
        status: 'completed',
        priority: 'high',
        id: '1',
      },
      {
        content: 'Create add method',
        status: 'in_progress',
        priority: 'high',
        id: '2',
      },
      {
        content: 'Create subtract method',
        status: 'pending',
        priority: 'high',
        id: '3',
      },
    ] as TodoItem[],
  },
  allCompleted: {
    description: 'all tasks completed',
    content: [
      {
        content: 'Add Calculator class',
        status: 'completed',
        priority: 'high',
        id: '1',
      },
      {
        content: 'Create add method',
        status: 'completed',
        priority: 'high',
        id: '2',
      },
      {
        content: 'Create subtract method',
        status: 'completed',
        priority: 'high',
        id: '3',
      },
    ] as TodoItem[],
  },
  refactoring: {
    description: 'refactoring in progress',
    content: [
      {
        content: 'Refactor Calculator class and tests',
        status: 'in_progress',
        priority: 'high',
        id: '1',
      },
    ] as TodoItem[],
  },
} as const

// Refactoring test data
export const refactoringImplementation = {
  beforeRefactor: {
    description: 'implementation with repetitive code',
    content: `export class Calculator {
  add(a: number, b: number): number {
    if (typeof a !== 'number') {
      throw new Error('First argument must be a number');
    }
    if (typeof b !== 'number') {
      throw new Error('Second argument must be a number');
    }
    return a + b;
  }

  subtract(a: number, b: number): number {
    if (typeof a !== 'number') {
      throw new Error('First argument must be a number');
    }
    if (typeof b !== 'number') {
      throw new Error('Second argument must be a number');
    }
    return a - b;
  }

  multiply(a: number, b: number): number {
    if (typeof a !== 'number') {
      throw new Error('First argument must be a number');
    }
    if (typeof b !== 'number') {
      throw new Error('Second argument must be a number');
    }
    return a * b;
  }
}`,
  },
  afterRefactor: {
    description: 'implementation after extracting common validation',
    content: `export class Calculator {
  private validateNumbers(a: unknown, b: unknown): void {
    if (typeof a !== 'number') {
      throw new Error('First argument must be a number');
    }
    if (typeof b !== 'number') {
      throw new Error('Second argument must be a number');
    }
  }

  add(a: number, b: number): number {
    this.validateNumbers(a, b);
    return a + b;
  }

  subtract(a: number, b: number): number {
    this.validateNumbers(a, b);
    return a - b;
  }

  multiply(a: number, b: number): number {
    this.validateNumbers(a, b);
    return a * b;
  }
}`,
  },
}

export const refactoringTests = {
  beforeRefactor: {
    description: 'test file with inline assertions',
    content: `import { describe, test, expect } from 'vitest'
import { Calculator } from './Calculator'

describe('Calculator', () => {
  test('adds two numbers', () => {
    const calc = new Calculator()
    expect(calc.add(2, 3)).toBe(5)
    expect(calc.add(-1, 1)).toBe(0)
    expect(calc.add(0, 0)).toBe(0)
  })

  test('subtracts two numbers', () => {
    const calc = new Calculator()
    expect(calc.subtract(5, 3)).toBe(2)
    expect(calc.subtract(0, 5)).toBe(-5)
    expect(calc.subtract(-1, -1)).toBe(0)
  })

  test('multiplies two numbers', () => {
    const calc = new Calculator()
    expect(calc.multiply(3, 4)).toBe(12)
    expect(calc.multiply(-2, 3)).toBe(-6)
    expect(calc.multiply(0, 5)).toBe(0)
  })
})`,
  },
  afterRefactor: {
    description: 'test file after extracting test setup',
    content: `import { describe, test, expect, beforeEach } from 'vitest'
import { Calculator } from './Calculator'

describe('Calculator', () => {
  let calc: Calculator

  beforeEach(() => {
    calc = new Calculator()
  })

  test('adds two numbers', () => {
    expect(calc.add(2, 3)).toBe(5)
    expect(calc.add(-1, 1)).toBe(0)
    expect(calc.add(0, 0)).toBe(0)
  })

  test('subtracts two numbers', () => {
    expect(calc.subtract(5, 3)).toBe(2)
    expect(calc.subtract(0, 5)).toBe(-5)
    expect(calc.subtract(-1, -1)).toBe(0)
  })

  test('multiplies two numbers', () => {
    expect(calc.multiply(3, 4)).toBe(12)
    expect(calc.multiply(-2, 3)).toBe(-6)
    expect(calc.multiply(0, 5)).toBe(0)
  })
})`,
  },
}

export const refactoringTestResults = {
  failing: {
    description: 'multiple tests failing',
    content: `FAIL src/Calculator/Calculator.test.ts
  ❯ Calculator
    × adds two numbers
      → expected 4 to be 5
    × subtracts two numbers  
      → expected 1 to be 2
    × multiplies two numbers
      → expected 11 to be 12

Test Files  1 failed (1)
Tests  3 failed (3)`,
  },
  passing: {
    description: 'all tests passing',
    content: `PASS src/Calculator/Calculator.test.ts
  ✓ Calculator (3 tests)

Test Files  1 passed (1)
Tests  3 passed (3)`,
  },
}
