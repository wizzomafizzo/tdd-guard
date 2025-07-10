import { describe, test, expect, vi, beforeEach } from 'vitest'
import { validator } from './validator'
import { Context } from '../contracts/types/Context'
import { IModelClient } from '../contracts/types/ModelClient'
import { generateDynamicContext } from './context/context'
import { testData } from '../test'

vi.mock('./context/context', () => ({
  generateDynamicContext: vi.fn(),
}))

describe('validator with mock model', () => {
  const mockGenerateDynamicContext = vi.mocked(generateDynamicContext)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('simplified interface', () => {
    test('should only pass prompt to model client without context', async () => {
      const { result, mockModelClient, context } = await runValidator(
        JSON.stringify({ decision: null, reason: 'ok' }),
        { prompt: 'complete prompt with all context included' }
      )

      expect(mockGenerateDynamicContext).toHaveBeenCalledWith(context)
      // Should only pass the prompt, not the context
      expect(mockModelClient.ask).toHaveBeenCalledWith(
        'complete prompt with all context included'
      )
      expect(result).toEqual({
        decision: undefined,
        reason: 'ok',
      })
    })
  })

  describe('JSON extraction from model responses', () => {
    const BLOCK_JSON = '{"decision": "block", "reason": "TDD violation"}'
    const PASS_JSON = '{"decision": null, "reason": "ok"}'

    const testCases = [
      {
        name: 'should extract JSON from markdown code blocks',
        modelResponse: `\`\`\`json\n${BLOCK_JSON}\n\`\`\``,
        expected: { decision: 'block', reason: 'TDD violation' },
      },
      {
        name: 'should handle JSON with extra whitespace in code blocks',
        modelResponse: `\`\`\`json  \n\n  ${PASS_JSON}  \n\n\`\`\``,
        expected: { decision: undefined, reason: 'ok' },
      },
      {
        name: 'should parse raw JSON when no code block present',
        modelResponse: PASS_JSON,
        expected: { decision: undefined, reason: 'ok' },
      },
      {
        name: 'should extract JSON from response with surrounding text',
        modelResponse: `Here is my analysis:\n\`\`\`json\n${BLOCK_JSON}\n\`\`\`\nThat concludes the review.`,
        expected: { decision: 'block', reason: 'TDD violation' },
      },
      {
        name: 'should handle fence blocks without language specification',
        modelResponse: `\`\`\`\n${PASS_JSON}\n\`\`\``,
        expected: { decision: undefined, reason: 'ok' },
      },
      {
        name: 'should ignore fence blocks with txt language',
        modelResponse: `\`\`\`txt\nSome analysis text\n\`\`\`\n${PASS_JSON}`,
        expected: { decision: undefined, reason: 'ok' },
      },
      {
        name: 'should extract the last JSON fence block when multiple exist',
        modelResponse: `First block:\n\`\`\`json\n${BLOCK_JSON}\n\`\`\`\nSecond block:\n\`\`\`json\n${PASS_JSON}\n\`\`\``,
        expected: { decision: undefined, reason: 'ok' },
      },
      {
        name: 'should handle invalid JSON gracefully',
        modelResponse: `\`\`\`json\ninvalid json content\n\`\`\``,
        expected: { decision: undefined, reason: 'Error during validation' },
      },
      {
        name: 'should convert null decision to undefined',
        modelResponse: '{"decision": null, "reason": "No issues found"}',
        expected: { decision: undefined, reason: 'No issues found' },
      },
    ]

    testCases.forEach(({ name, modelResponse, expected }) => {
      test(name, async () => {
        const { result } = await runValidator(modelResponse)
        expect(result).toEqual(expected)
      })
    })
  })

  describe('prompt generation for different tools', () => {
    test('should send correct prompt for Edit operation', async () => {
      const { result, mockModelClient, context } = await runValidator(
        JSON.stringify({ decision: null, reason: 'ok' }),
        { prompt: 'mocked prompt with Edit instructions' }
      )

      expect(mockGenerateDynamicContext).toHaveBeenCalledWith(context)
      expect(mockModelClient.ask).toHaveBeenCalledWith(
        'mocked prompt with Edit instructions'
      )
      expect(result).toEqual({
        decision: undefined,
        reason: 'ok',
      })
    })
  })

  // Test helper
  async function runValidator(
    modelResponse: string,
    options?: {
      contextOverrides?: Partial<Context>
      prompt?: string
    }
  ) {
    const mockModelClient: IModelClient = {
      ask: vi.fn().mockResolvedValue(modelResponse),
    }

    const context: Context = {
      modifications: JSON.stringify(testData.editOperation()),
      ...options?.contextOverrides,
    }

    mockGenerateDynamicContext.mockReturnValue(options?.prompt || 'test prompt')

    const result = await validator(context, mockModelClient)

    return {
      result,
      mockModelClient,
      context,
    }
  }
})
