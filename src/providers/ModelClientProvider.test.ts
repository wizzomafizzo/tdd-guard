import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { ModelClientProvider } from './ModelClientProvider'
import { Config } from '../config/Config'
import { ClaudeCli } from '../validation/models/ClaudeCli'
import { AnthropicApi } from '../validation/models/AnthropicApi'

describe('ModelClientProvider', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('returns ClaudeCli when config modelType is claude_cli', () => {
    process.env.MODEL_TYPE = 'claude_cli'
    const config = new Config()

    const provider = new ModelClientProvider()
    const client = provider.getModelClient(config)

    expect(client).toBeInstanceOf(ClaudeCli)
  })

  test('returns AnthropicApi when config modelType is anthropic_api', () => {
    process.env.MODEL_TYPE = 'anthropic_api'
    const config = new Config()

    const provider = new ModelClientProvider()
    const client = provider.getModelClient(config)

    expect(client).toBeInstanceOf(AnthropicApi)
  })

  test('uses config modelType which respects test mode', () => {
    process.env.MODEL_TYPE = 'claude_cli'
    process.env.TEST_MODEL_TYPE = 'anthropic_api'

    const config = new Config({ mode: 'test' })
    const provider = new ModelClientProvider()
    const client = provider.getModelClient(config)

    expect(client).toBeInstanceOf(AnthropicApi)

    delete process.env.TEST_MODEL_TYPE
  })

  test('uses default config when no config is provided', () => {
    const provider = new ModelClientProvider()
    const client = provider.getModelClient()

    expect(client).toBeInstanceOf(ClaudeCli) // Default modelType is 'claude_cli'
  })
})
