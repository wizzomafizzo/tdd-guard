import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { Config } from './Config'

describe('Config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('uses TDD_DATA_DIR environment variable when set', () => {
    process.env.TDD_DATA_DIR = '/custom/data/path'

    const config = new Config()

    expect(config.dataDir).toBe('/custom/data/path')
  })

  test('defaults to .claude/tdd-guard/data when TDD_DATA_DIR not set', () => {
    delete process.env.TDD_DATA_DIR

    const config = new Config()

    expect(config.dataDir).toBe('.claude/tdd-guard/data')
  })

  test('testReportPath returns test.txt path within dataDir', () => {
    process.env.TDD_DATA_DIR = '/my/data'

    const config = new Config()

    expect(config.testReportPath).toBe('/my/data/test.txt')
  })

  test('useLocalClaude returns true when USE_LOCAL_CLAUDE is true', () => {
    process.env.USE_LOCAL_CLAUDE = 'true'

    const config = new Config()

    expect(config.useLocalClaude).toBe(true)

    delete process.env.USE_LOCAL_CLAUDE
  })

  test('useLocalClaude returns false when USE_LOCAL_CLAUDE is not true', () => {
    // Test with 'false'
    process.env.USE_LOCAL_CLAUDE = 'false'
    let config = new Config()
    expect(config.useLocalClaude).toBe(false)

    // Test with undefined
    delete process.env.USE_LOCAL_CLAUDE
    config = new Config()
    expect(config.useLocalClaude).toBe(false)

    // Test with empty string
    process.env.USE_LOCAL_CLAUDE = ''
    config = new Config()
    expect(config.useLocalClaude).toBe(false)

    delete process.env.USE_LOCAL_CLAUDE
  })

  test('fileStoragePath returns storage subdirectory within dataDir', () => {
    process.env.TDD_DATA_DIR = '/my/data'

    const config = new Config()

    expect(config.fileStoragePath).toBe('/my/data/storage')
  })
})
