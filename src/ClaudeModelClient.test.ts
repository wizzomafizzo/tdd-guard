import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ClaudeModelClient } from './ClaudeModelClient'
import { execSync } from 'child_process'
import { Context } from './types/Context'

vi.mock('child_process')

describe('ClaudeModelClient', () => {
  const question = 'Does this follow TDD?'
  const context = {
    todo: 'todo list content',
    edit: 'edit content',
    test: 'test output content',
  }
  const result = 'This code follows TDD principles'
  const format = '--output-format json'
  const maxTurnsFlag = '--max-turns 1'
  const printFlag = '--print'
  const command = 'claude'
  const modelFlag = '--model sonnet'
  const encodingOption = { encoding: 'utf-8' }
  const timeoutOption = { timeout: 10000 }

  let sut: ReturnType<typeof setupModelClient>

  beforeEach(() => {
    sut = setupModelClient()
  })

  test('includes question in prompt', () => {
    sut.assertCommandContains(question)
  })

  test('includes todo context in prompt', () => {
    sut.assertCommandContains('<todo>todo list content</todo>')
  })

  test('includes edit context in prompt', () => {
    sut.assertCommandContains('<edit>edit content</edit>')
  })

  test('includes test context in prompt', () => {
    sut.assertCommandContains('<test>test output content</test>')
  })

  test('uses json output format', () => {
    sut.assertCommandContains(format)
  })

  test('limits to single turn', () => {
    sut.assertCommandContains(maxTurnsFlag)
  })

  test('uses claude command', () => {
    sut.assertCommandContains(command)
  })

  test('uses print mode flag', () => {
    sut.assertCommandContains(printFlag)
  })

  test('uses sonnet model flag', () => {
    sut.assertCommandContains(modelFlag)
  })

  test('includes line break after question', () => {
    sut.assertCommandContains(question + '\n')
  })

  test('includes context explanation', () => {
    sut.assertCommandContains('The following context is provided:')
  })

  test('explains edit section', () => {
    sut.assertCommandContains(
      'Edit: This section shows the changes that the agent wants to make'
    )
  })

  test('explains todo section when present', () => {
    sut.assertCommandContains(
      "Todo: Current state of the agent'\\''s task list"
    )
  })

  test('explains test section when present', () => {
    sut.assertCommandContains('Test: The test output from running the tests')
  })

  test('handles context with only edit field', () => {
    const contextWithOnlyEdit = { edit: 'only edit content' }
    const sutWithPartialContext = setupModelClient({
      context: contextWithOnlyEdit,
    })
    sutWithPartialContext.assertCommandContains(
      '<edit>only edit content</edit>'
    )
    // Should still explain edit section
    sutWithPartialContext.assertCommandContains(
      'Edit: This section shows the changes that the agent wants to make'
    )
    // Should not include todo section or tags when todo is not present
    sutWithPartialContext.assertCommandDoesNotContain('Todo:')
    sutWithPartialContext.assertCommandDoesNotContain('<todo>')
    // Should not include test section or tags when test is not present
    sutWithPartialContext.assertCommandDoesNotContain('Test:')
    sutWithPartialContext.assertCommandDoesNotContain('<test>')
  })

  test('uses utf-8 encoding', () => {
    sut.assertCalledWithOptions(encodingOption)
  })

  test('sets timeout to 10 seconds', () => {
    sut.assertCalledWithOptions(timeoutOption)
  })

  test('returns parsed result from response', () => {
    expect(sut.result).toBe(result)
  })

  describe('handles special characters', () => {
    const questionWithQuote = "What's the TDD pattern?"
    const contextWithQuote = { edit: "test('it should work', () => {})" }

    let sut: ReturnType<typeof setupModelClient>

    beforeEach(() => {
      sut = setupModelClient({
        question: questionWithQuote,
        context: contextWithQuote,
      })
    })

    test('escapes single quotes in question', () => {
      sut.assertCommandContains("What'\\''s the TDD pattern?")
    })

    test('escapes single quotes in context', () => {
      sut.assertCommandContains("test('\\''it should work'\\''")
    })
  })

  // Test helper
  function setupModelClient(testData?: {
    question?: string
    context?: Context
    result?: string
  }) {
    const {
      question: q = question,
      context: c = context,
      result: r = result,
    } = testData || {}

    const mockExecSync = vi.mocked(execSync)
    mockExecSync.mockReturnValue(JSON.stringify({ result: r }))

    const client = new ClaudeModelClient()
    const actualResult = client.ask(q, c)

    const assertCommandContains = (content: string) => {
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining(content),
        expect.any(Object)
      )
    }

    const assertCommandDoesNotContain = (content: string) => {
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.not.stringContaining(content),
        expect.any(Object)
      )
    }

    const assertCalledWithOptions = (expectedOptions: object) => {
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining(expectedOptions)
      )
    }

    return {
      result: actualResult,
      assertCommandContains,
      assertCommandDoesNotContain,
      assertCalledWithOptions,
    }
  }
})
