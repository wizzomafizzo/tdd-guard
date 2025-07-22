import { describe, test, expect } from 'vitest'
import { LinterProvider } from './LinterProvider'
import { Config } from '@tdd-guard/config'
import { ESLint } from '../linters/eslint/ESLint'

describe('LinterProvider', () => {
  test('returns ESLint when config linterType is eslint', () => {
    const config = new Config({ linterType: 'eslint' })

    const provider = new LinterProvider()
    const linter = provider.getLinter(config)

    expect(linter).toBeInstanceOf(ESLint)
  })

  test('returns null when config linterType is undefined', () => {
    const config = new Config({ linterType: undefined })

    const provider = new LinterProvider()
    const linter = provider.getLinter(config)

    expect(linter).toBeNull()
  })

  test('uses default config when no config is provided', () => {
    const provider = new LinterProvider()
    const linter = provider.getLinter()

    expect(linter).toBeNull() // Default linterType is undefined
  })
})
