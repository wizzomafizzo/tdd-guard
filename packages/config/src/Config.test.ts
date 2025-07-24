import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { Config } from './Config'

describe('Config', () => {
  const originalEnv = process.env
  const customDataDir = '/custom/data/dir'

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('dataDir', () => {
    let config: Config

    beforeEach(() => {
      config = new Config({ dataDir: customDataDir })
    })

    test('accepts custom dataDir in options', () => {
      expect(config.dataDir).toBe(customDataDir)
    })

    test('defaults to .claude/tdd-guard/data when not provided', () => {
      const defaultConfig = new Config()
      expect(defaultConfig.dataDir).toBe('.claude/tdd-guard/data')
    })

    test('uses projectRoot when provided', () => {
      const projectRoot = '/my/project/root'
      const configWithRoot = new Config({ projectRoot })
      expect(configWithRoot.dataDir).toBe(
        '/my/project/root/.claude/tdd-guard/data'
      )
    })

    test('testResultsFilePath returns test.json path within dataDir', () => {
      expect(config.testResultsFilePath).toBe(`${customDataDir}/test.json`)
    })

    test('todosFilePath returns todos.json path within dataDir', () => {
      expect(config.todosFilePath).toBe(`${customDataDir}/todos.json`)
    })

    test('modificationsFilePath returns modifications.json path within dataDir', () => {
      expect(config.modificationsFilePath).toBe(
        `${customDataDir}/modifications.json`
      )
    })

    test('lintFilePath returns lint.json path within dataDir', () => {
      expect(config.lintFilePath).toBe(`${customDataDir}/lint.json`)
    })

    test('configFilePath returns config.json path within dataDir', () => {
      expect(config.configFilePath).toBe(`${customDataDir}/config.json`)
    })
  })

  describe('useSystemClaude', () => {
    test('can be set via options', () => {
      const config = new Config({ useSystemClaude: true })

      expect(config.useSystemClaude).toBe(true)
    })

    test('options take precedence over env var', () => {
      process.env.USE_SYSTEM_CLAUDE = 'false'

      const config = new Config({ useSystemClaude: true })

      expect(config.useSystemClaude).toBe(true)
    })

    test('falls back to env var when not in options', () => {
      process.env.USE_SYSTEM_CLAUDE = 'true'

      const config = new Config({})

      expect(config.useSystemClaude).toBe(true)
    })

    test('defaults to false when neither options nor env var are set', () => {
      delete process.env.USE_SYSTEM_CLAUDE

      const config = new Config()

      expect(config.useSystemClaude).toBe(false)
    })

    test('returns false for non-true env values', () => {
      // Test with 'false'
      process.env.USE_SYSTEM_CLAUDE = 'false'
      let config = new Config()
      expect(config.useSystemClaude).toBe(false)

      // Test with empty string
      process.env.USE_SYSTEM_CLAUDE = ''
      config = new Config()
      expect(config.useSystemClaude).toBe(false)
    })
  })

  describe('anthropicApiKey', () => {
    test('can be set via options', () => {
      const config = new Config({ anthropicApiKey: 'options-api-key' })

      expect(config.anthropicApiKey).toBe('options-api-key')
    })

    test('options take precedence over env var', () => {
      process.env.TDD_GUARD_ANTHROPIC_API_KEY = 'env-api-key'

      const config = new Config({ anthropicApiKey: 'options-api-key' })

      expect(config.anthropicApiKey).toBe('options-api-key')
    })

    test('falls back to env var when not in options', () => {
      process.env.TDD_GUARD_ANTHROPIC_API_KEY = 'env-api-key'

      const config = new Config()

      expect(config.anthropicApiKey).toBe('env-api-key')
    })

    test('returns undefined when neither options nor env var are set', () => {
      delete process.env.TDD_GUARD_ANTHROPIC_API_KEY

      const config = new Config()

      expect(config.anthropicApiKey).toBeUndefined()
    })
  })

  describe('modelType', () => {
    test('can be set via options', () => {
      const config = new Config({ modelType: 'anthropic_api' })

      expect(config.modelType).toBe('anthropic_api')
    })

    test('options take precedence over env vars', () => {
      process.env.MODEL_TYPE = 'claude_cli'

      const config = new Config({ modelType: 'anthropic_api' })

      expect(config.modelType).toBe('anthropic_api')
    })

    test('options take precedence even in test mode with TEST_MODEL_TYPE', () => {
      process.env.MODEL_TYPE = 'claude_cli'
      process.env.TEST_MODEL_TYPE = 'test_model'

      const config = new Config({ mode: 'test', modelType: 'anthropic_api' })

      expect(config.modelType).toBe('anthropic_api')
    })

    test('falls back to MODEL_TYPE env var in production mode', () => {
      process.env.MODEL_TYPE = 'anthropic_api'

      const config = new Config()

      expect(config.modelType).toBe('anthropic_api')
    })

    test('uses TEST_MODEL_TYPE in test mode when available', () => {
      process.env.MODEL_TYPE = 'claude_cli'
      process.env.TEST_MODEL_TYPE = 'anthropic_api'

      const config = new Config({ mode: 'test' })

      expect(config.modelType).toBe('anthropic_api')
    })

    test('falls back to MODEL_TYPE in test mode when TEST_MODEL_TYPE is not set', () => {
      process.env.MODEL_TYPE = 'anthropic_api'
      delete process.env.TEST_MODEL_TYPE

      const config = new Config({ mode: 'test' })

      expect(config.modelType).toBe('anthropic_api')
    })

    test('defaults to claude_cli when no env vars are set', () => {
      delete process.env.MODEL_TYPE
      delete process.env.TEST_MODEL_TYPE

      const config = new Config()

      expect(config.modelType).toBe('claude_cli')
    })
  })

  describe('linterType', () => {
    test('returns undefined when no configuration provided', () => {
      delete process.env.LINTER_TYPE

      const config = new Config()

      expect(config.linterType).toBeUndefined()
    })

    test('returns eslint when LINTER_TYPE env var is set to eslint', () => {
      process.env.LINTER_TYPE = 'eslint'

      const config = new Config()

      expect(config.linterType).toBe('eslint')
    })

    test('returns value from ConfigOptions when linterType is provided', () => {
      const config = new Config({ linterType: 'eslint' })

      expect(config.linterType).toBe('eslint')
    })

    test('ConfigOptions takes precedence over env var', () => {
      process.env.LINTER_TYPE = 'pylint'

      const config = new Config({ linterType: 'eslint' })

      expect(config.linterType).toBe('eslint')
    })

    test('returns undefined for empty string env var', () => {
      process.env.LINTER_TYPE = ''

      const config = new Config()

      expect(config.linterType).toBeUndefined()
    })

    test('returns future linter types when configured', () => {
      // Test that the system is extensible for future linter types
      process.env.LINTER_TYPE = 'pylint'

      const config = new Config()

      expect(config.linterType).toBe('pylint')
    })

    test('returns linterType in lowercase when env var is uppercase', () => {
      process.env.LINTER_TYPE = 'ESLINT'

      const config = new Config()

      expect(config.linterType).toBe('eslint')
    })

    test('returns linterType in lowercase when ConfigOptions is uppercase', () => {
      const config = new Config({ linterType: 'ESLINT' })

      expect(config.linterType).toBe('eslint')
    })
  })
})
