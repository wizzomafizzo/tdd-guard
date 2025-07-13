import { describe, test, expect } from 'vitest'
import { validator } from '../../src/validation/validator'
import { Context } from '../../src/contracts/types/Context'
import { ValidationResult } from '../../src/contracts/types/ValidationResult'
import { Config } from '../../src/config/Config'
import { ModelClientProvider } from '../../src/providers/ModelClientProvider'
import { testData } from '@testUtils'

const { implementationModifications, todos, testResults, createEditOperation } =
  testData

describe('Core Validator Scenarios', () => {
  const implementationFile = 'src/Calculator/Calculator.ts'
  const config = new Config({ mode: 'test' })
  const provider = new ModelClientProvider()
  const model = provider.getModelClient(config)

  test('should allow making a failing test pass', async () => {
    const oldContent = implementationModifications.methodStubReturning0.content
    const newContent = implementationModifications.methodImplementation.content
    const operation = createEditOperation(
      implementationFile,
      oldContent,
      newContent
    )
    const context: Context = {
      modifications: operation,
      todo: JSON.stringify(todos.methodInProgress.content),
      test: testResults.assertionError.content,
    }

    const result = await validator(context, model)
    expectDecision(result, undefined)
  })

  test('should block premature implementation', async () => {
    const oldContent = implementationModifications.empty.content
    const newContent = implementationModifications.completeClass.content
    const operation = createEditOperation(
      implementationFile,
      oldContent,
      newContent
    )
    const context: Context = {
      modifications: operation,
      todo: JSON.stringify(todos.methodInProgress.content),
      test: testResults.notDefined.content,
    }

    const result = await validator(context, model)
    expectDecision(result, 'block')
  })
})

function expectDecision(
  result: ValidationResult,
  expectedDecision: ValidationResult['decision']
): void {
  if (result.decision !== expectedDecision) {
    console.error(
      `\nTest failed - expected decision: ${expectedDecision}, but got: ${result.decision}`
    )
    console.error(`Reason: ${result.reason}\n`)
  }
  expect(result.decision).toBe(expectedDecision)
}
