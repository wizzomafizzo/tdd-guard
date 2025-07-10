import { describe, test, expect, vi, beforeEach } from 'vitest'
import { AnthropicApi } from './AnthropicApi'
import Anthropic from '@anthropic-ai/sdk'
import { testData } from '../../test'

vi.mock('@anthropic-ai/sdk')

describe('AnthropicApi', () => {
  let sut: Awaited<ReturnType<typeof createSut>>
  let client: AnthropicApi

  beforeEach(() => {
    sut = createSut()
    client = sut.client
  })

  test('should implement IModelClient interface', () => {
    expect(client.ask).toBeDefined()
  })

  test('should accept optional Config in constructor', () => {
    const config = testData.config()
    const client = new AnthropicApi(config)
    expect(client).toBeDefined()
  })

  test('should create Anthropic client with API key from config', () => {
    const apiKey = 'test-api-key-123'
    const localSut = createSut({ anthropicApiKey: apiKey })

    expect(localSut.wasCreatedWithApiKey(apiKey)).toBe(true)
  })

  test('uses claude-sonnet-4 model', async () => {
    const call = await sut.askAndGetCall()
    expect(call.model).toBe('claude-sonnet-4-20250514')
  })

  test('sets max tokens to 1024', async () => {
    const call = await sut.askAndGetCall()
    expect(call.max_tokens).toBe(1024)
  })

  test('passes prompt as user message', async () => {
    const prompt = 'Does this follow TDD?'
    const call = await sut.askAndGetCall(prompt)
    expect(call.messages).toEqual([
      {
        role: 'user',
        content: prompt,
      },
    ])
  })

  test('ask method should return text from response', async () => {
    const expectedText = 'Model response text'
    const result = await sut.askWithResponse(expectedText)

    expect(result).toBe(expectedText)
  })

  test('ask method should throw error when API call fails', async () => {
    await expect(sut.askWithError('API error')).rejects.toThrow('API error')
  })

  test('ask method should handle empty content array', async () => {
    sut.mockCreate.mockResolvedValue({ content: [] })

    await expect(client.ask('test prompt')).rejects.toThrow()
  })

  test('ask method should handle missing text property', async () => {
    sut.mockCreate.mockResolvedValue({ content: [{ type: 'image' }] })

    await expect(client.ask('test prompt')).rejects.toThrow()
  })
})

// Test Helpers
function createSut(configOverrides?: Parameters<typeof testData.config>[0]) {
  vi.clearAllMocks()

  const mockCreate = vi.fn().mockResolvedValue({
    content: [{ text: 'Model response' }],
  })

  const mockAnthropicConstructor = vi.mocked(Anthropic)
  mockAnthropicConstructor.mockImplementation(
    () =>
      ({
        messages: {
          create: mockCreate,
        },
      }) as unknown as Anthropic
  )

  const config = testData.config(configOverrides)
  const client = new AnthropicApi(config)

  const mockResponse = (text: string) => {
    mockCreate.mockResolvedValue({
      content: [{ text }],
    })
  }

  const getLastCall = () => {
    const lastCall = mockCreate.mock.calls[mockCreate.mock.calls.length - 1]
    const params = lastCall[0]
    return {
      model: params.model,
      max_tokens: params.max_tokens,
      messages: params.messages,
    }
  }

  const askAndGetCall = async (prompt = 'test prompt') => {
    await client.ask(prompt)
    return getLastCall()
  }

  const wasCreatedWithApiKey = (apiKey: string) => {
    return mockAnthropicConstructor.mock.calls.some(
      (call) => call[0]?.apiKey === apiKey
    )
  }

  const askWithResponse = async (responseText: string) => {
    mockResponse(responseText)
    return client.ask('test prompt')
  }

  const askWithError = async (errorMessage: string) => {
    mockCreate.mockRejectedValue(new Error(errorMessage))
    return client.ask('test prompt')
  }

  return {
    client,
    mockCreate,
    mockAnthropicConstructor,
    config,
    mockResponse,
    getLastCall,
    askAndGetCall,
    wasCreatedWithApiKey,
    askWithResponse,
    askWithError,
  }
}
