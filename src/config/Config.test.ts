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

  test('dataDir is hardcoded to .claude/tdd-guard/data', () => {
    const config = new Config()

    expect(config.dataDir).toBe('.claude/tdd-guard/data')
  })

  test('testReportPath returns test.txt path within dataDir', () => {
    const config = new Config()

    expect(config.testReportPath).toBe('.claude/tdd-guard/data/test.txt')
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
    const config = new Config()

    expect(config.fileStoragePath).toBe('.claude/tdd-guard/data/storage')
  })
})
