import { describe, test, expect, vi, beforeEach } from 'vitest'
import { tddValidator } from './tddValidator'
import { Context } from '../contracts/types/Context'
import { IModelClient } from '../contracts/types/ModelClient'
import { generateDynamicContext } from './context/context'
import { testData } from '../test'

vi.mock('./context/context', () => ({
  generateDynamicContext: vi.fn(),
}))

describe('tddValidator with mock model', () => {
  const mockGenerateDynamicContext = vi.mocked(generateDynamicContext)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('simplified interface', () => {
    test('should only pass prompt to model client without context', async () => {
      const mockModelClient: IModelClient = {
        ask: vi
          .fn()
          .mockResolvedValue(JSON.stringify({ decision: null, reason: 'ok' })),
      }

      const editOperation = testData.editOperation()
      const context: Context = {
        modifications: JSON.stringify(editOperation),
      }

      // Set up mock to return a complete prompt
      mockGenerateDynamicContext.mockReturnValue(
        'complete prompt with all context included'
      )

      const result = await tddValidator(context, mockModelClient)

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

  describe('prompt generation for different tools', () => {
    test('should send correct prompt for Edit operation', async () => {
      const mockModelClient: IModelClient = {
        ask: vi
          .fn()
          .mockResolvedValue(JSON.stringify({ decision: null, reason: 'ok' })),
      }

      const editOperation = testData.editOperation()
      const context: Context = {
        modifications: JSON.stringify(editOperation),
      }

      // Set up mock to capture the prompt
      mockGenerateDynamicContext.mockReturnValue(
        'mocked prompt with Edit instructions'
      )

      const result = await tddValidator(context, mockModelClient)

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
})
