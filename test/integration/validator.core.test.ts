import { describe, test } from 'vitest'
import { validator } from '../../src/validation/validator'
import { Context } from '@tdd-guard/contracts'
import { Config } from '../../src/config/Config'
import { ModelClientProvider } from '../../src/providers/ModelClientProvider'
import { testData } from '@testUtils'
import { expectDecision } from '../utils/factories/scenarios'

const { createEditOperation, languages } = testData

describe('Core Validator Scenarios', () => {
  const config = new Config({ mode: 'test' })
  const provider = new ModelClientProvider()
  const model = provider.getModelClient(config)

  languages.forEach((lang) => {
    describe(`${lang.language} scenarios`, () => {
      test('should allow making a failing test pass', async () => {
        const oldContent =
          lang.implementationModifications.methodStubReturning0.content
        const newContent =
          lang.implementationModifications.methodImplementation.content
        const operation = createEditOperation(
          lang.implementationFile,
          oldContent,
          newContent
        )
        const context: Context = {
          modifications: operation,
          todo: JSON.stringify(lang.todos.methodInProgress.content),
          test: lang.testResults.assertionError.content,
        }

        const result = await validator(context, model)
        expectDecision(result, undefined)
      })

      test('should block premature implementation', async () => {
        const oldContent = lang.implementationModifications.empty.content
        const newContent =
          lang.implementationModifications.completeClass.content
        const operation = createEditOperation(
          lang.implementationFile,
          oldContent,
          newContent
        )
        const context: Context = {
          modifications: operation,
          todo: JSON.stringify(lang.todos.methodInProgress.content),
          test: lang.testResults.notDefined.content,
        }

        const result = await validator(context, model)
        expectDecision(result, 'block')
      })

      test('should block adding multiple tests at once', async () => {
        const oldContent =
          lang.testModifications.emptyTestContainerWithImports.content
        const newContent =
          lang.testModifications.multipleTestsWithImports.content
        const operation = createEditOperation(
          lang.testFile,
          oldContent,
          newContent
        )
        const context: Context = {
          modifications: operation,
          todo: JSON.stringify(lang.todos.empty.content),
          test: lang.testResults.empty.content,
        }

        const result = await validator(context, model)
        expectDecision(result, 'block')
      })

      test('should allow test refactoring when tests are passing', async () => {
        const oldContent = lang.testModifications.multipleTests.content
        const newContent = lang.testModifications.refactoredTests.content
        const operation = createEditOperation(
          lang.testFile,
          oldContent,
          newContent
        )
        const context: Context = {
          modifications: operation,
          todo: JSON.stringify(lang.todos.empty.content),
          test: lang.testResults.passing.content,
        }

        const result = await validator(context, model)
        expectDecision(result, undefined)
      })
    })
  })
})
