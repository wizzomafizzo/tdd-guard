import { describe, test, expect } from 'vitest'
import { validator } from '../../src/validation/validator'
import { Context } from '../../src/contracts/types/Context'
import { Config } from '../../src/config/Config'
import { ModelClientProvider } from '../../src/providers/ModelClientProvider'
import { testData } from '@testUtils'
import { testModifications } from '../utils/factories/scenarios'

const {
  createWriteOperation,
  implementationModifications,
  todos,
  testResults,
} = testData

describe('Core Validator Scenarios', () => {
  const testFile = 'src/Calculator/Calculator.test.ts'
  const implementationFile = 'src/Calculator/Calculator.ts'
  const config = new Config({ mode: 'test' })
  const provider = new ModelClientProvider()
  const model = provider.getModelClient(config)

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

  test('should block adding multiple test', async () => {
    const content = testModifications.multipleTestsWithImports.content
    const operation = createWriteOperation(testFile, content)
    const context: Context = {
      modifications: operation,
      todo: JSON.stringify(todos.empty.content),
      test: testResults.empty.content,
    }

    const result = await validator(context, model)
    expect(result.decision).toBe('block')
  })
})
