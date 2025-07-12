import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { Config } from './Config'
import { ClaudeCli } from '../validation/models/ClaudeCli'
import { AnthropicApi } from '../validation/models/AnthropicApi'

describe('Config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('dataDir is hardcoded to .claude/tdd-guard/data', () => {
    const config = new Config()

    expect(config.dataDir).toBe('.claude/tdd-guard/data')
  })

  test('testReportPath returns test.txt path within dataDir', () => {
    const config = new Config()

    expect(config.testReportPath).toBe('.claude/tdd-guard/data/test.txt')
  })

  test('useSystemClaude returns true when USE_SYSTEM_CLAUDE is true', () => {
    process.env.USE_SYSTEM_CLAUDE = 'true'

    const config = new Config()

    expect(config.useSystemClaude).toBe(true)

    delete process.env.USE_SYSTEM_CLAUDE
  })

  test('useSystemClaude returns false when USE_SYSTEM_CLAUDE is not true', () => {
    // Test with 'false'
    process.env.USE_SYSTEM_CLAUDE = 'false'
    let config = new Config()
    expect(config.useSystemClaude).toBe(false)

    // Test with undefined
    delete process.env.USE_SYSTEM_CLAUDE
    config = new Config()
    expect(config.useSystemClaude).toBe(false)

    // Test with empty string
    process.env.USE_SYSTEM_CLAUDE = ''
    config = new Config()
    expect(config.useSystemClaude).toBe(false)

    delete process.env.USE_SYSTEM_CLAUDE
  })

  test('anthropicApiKey returns value from TDD_GUARD_ANTHROPIC_API_KEY env var', () => {
    process.env.TDD_GUARD_ANTHROPIC_API_KEY = 'test-api-key-123'

    const config = new Config()

    expect(config.anthropicApiKey).toBe('test-api-key-123')

    delete process.env.TDD_GUARD_ANTHROPIC_API_KEY
  })

  test('anthropicApiKey returns undefined when TDD_GUARD_ANTHROPIC_API_KEY is not set', () => {
    delete process.env.TDD_GUARD_ANTHROPIC_API_KEY

    const config = new Config()

    expect(config.anthropicApiKey).toBeUndefined()
  })

  test('modelType returns claude_cli when MODEL_TYPE is set to claude_cli', () => {
    process.env.MODEL_TYPE = 'claude_cli'

    const config = new Config()

    expect(config.modelType).toBe('claude_cli')
  })

  test('modelType returns anthropic_api when MODEL_TYPE is set to anthropic_api', () => {
    process.env.MODEL_TYPE = 'anthropic_api'

    const config = new Config()

    expect(config.modelType).toBe('anthropic_api')
  })

  test('modelType defaults to claude_cli when MODEL_TYPE is not set', () => {
    delete process.env.MODEL_TYPE

    const config = new Config()

    expect(config.modelType).toBe('claude_cli')
  })

  test('getModelClient returns ClaudeCli when modelType is claude_cli', () => {
    process.env.MODEL_TYPE = 'claude_cli'

    const config = new Config()
    const client = config.getModelClient()

    expect(client).toBeInstanceOf(ClaudeCli)
  })

  test('getModelClient returns AnthropicApi when modelType is anthropic_api', () => {
    process.env.MODEL_TYPE = 'anthropic_api'
    process.env.TDD_GUARD_ANTHROPIC_API_KEY = 'test-key'

    const config = new Config()
    const client = config.getModelClient()

    expect(client).toBeInstanceOf(AnthropicApi)
  })

  test('getModelClient uses TEST_MODEL_TYPE in test mode over MODEL_TYPE', () => {
    process.env.MODEL_TYPE = 'claude_cli'
    process.env.TEST_MODEL_TYPE = 'anthropic_api'
    process.env.TDD_GUARD_ANTHROPIC_API_KEY = 'test-key'

    const config = new Config()
    const client = config.getModelClient(true) // true indicates test mode

    expect(client).toBeInstanceOf(AnthropicApi)
  })
})
