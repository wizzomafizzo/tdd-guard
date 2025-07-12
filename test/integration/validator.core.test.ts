import { describe, test, expect } from 'vitest'
import { validator } from '../../src/validation/validator'
import { Context } from '../../src/contracts/types/Context'
import { Config } from '../../src/config/Config'
import { testData } from '@testUtils'

const {
  createWriteOperation,
  implementationModifications,
  todos,
  testResults,
} = testData

describe('Core Validator Scenarios', () => {
  const implementationFile = 'src/Calculator/Calculator.ts'
  const config = new Config()
  const model = config.getModelClient(true) // Use test mode

  test('should allow making a failing test pass', async () => {
    const content = implementationModifications.methodImplementation.content
    const operation = createWriteOperation(implementationFile, content)
    const context: Context = {
      modifications: operation,
      todo: JSON.stringify(todos.methodInProgress.content),
      test: testResults.assertionError.content,
    }

    const result = await validator(context, model)
    expect(result.decision).toBe(undefined)
  })

  test('should block premature implementation', async () => {
    const content = implementationModifications.overEngineered.content
    const operation = createWriteOperation(implementationFile, content)
    const context: Context = {
      modifications: operation,
      todo: JSON.stringify(todos.methodInProgress.content),
      test: testResults.assertionError.content,
    }

    const result = await validator(context, model)
    expect(result.decision).toBe('block')
  })
})
