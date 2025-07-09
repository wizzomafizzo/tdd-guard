import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ClaudeModelClient } from './ClaudeModelClient'
import { execFileSync } from 'child_process'
import * as fs from 'fs'
import { testData } from '../../test'

vi.mock('child_process')
vi.mock('fs', { spy: true })

describe('ClaudeModelClient', () => {
  const mockExecFileSync = vi.mocked(execFileSync)
  let client: ClaudeModelClient

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock response
    mockExecFileSync.mockReturnValue(JSON.stringify({ result: 'test' }))

    // Mock fs.existsSync to return true by default
    vi.spyOn(fs, 'existsSync').mockReturnValue(true)

    // Create client with test config (useLocalClaude: false by default)
    const config = testData.config()
    client = new ClaudeModelClient(config)
  })

  describe('command construction', () => {
    test('uses correct claude command with all flags', () => {
      client.ask('test prompt')

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'claude',
        [
          '-',
          '--output-format',
          'json',
          '--max-turns',
          '1',
          '--model',
          'sonnet',
        ],
        expect.any(Object)
      )
    })
  })

  describe('subprocess configuration', () => {
    test('passes prompt via input option', () => {
      const prompt = 'Does this follow TDD?'

      client.ask(prompt)

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'claude',
        expect.any(Array),
        expect.objectContaining({
          input: prompt,
        })
      )
    })

    test('uses utf-8 encoding', () => {
      client.ask('test')

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'claude',
        expect.any(Array),
        expect.objectContaining({
          encoding: 'utf-8',
        })
      )
    })

    test('sets timeout to 20 seconds', () => {
      client.ask('test')

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'claude',
        expect.any(Array),
        expect.objectContaining({
          timeout: 20000,
        })
      )
    })

    test('executes claude command from .claude subdirectory', () => {
      client.ask('test')

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'claude',
        expect.any(Array),
        expect.objectContaining({
          cwd: expect.stringContaining('.claude'),
        })
      )
    })

    test('creates .claude directory if it does not exist', () => {
      const mockMkdirSync = vi.spyOn(fs, 'mkdirSync')
      const mockExistsSync = vi.spyOn(fs, 'existsSync')

      mockExistsSync.mockReturnValue(false)

      client.ask('test')

      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.claude'),
        { recursive: true }
      )

      mockMkdirSync.mockRestore()
      mockExistsSync.mockRestore()
    })
  })

  describe('response parsing', () => {
    test('extracts JSON from markdown code blocks', () => {
      mockExecFileSync.mockReturnValue(
        JSON.stringify({ result: '```json\n{"approved": true}\n```' })
      )

      const result = client.ask('test prompt')

      expect(result).toBe('{"approved": true}')
    })

    test('handles JSON code blocks with extra whitespace', () => {
      mockExecFileSync.mockReturnValue(
        JSON.stringify({
          result: '```json  \n\n  {"approved": false}  \n\n```',
        })
      )

      const result = client.ask('test prompt')

      expect(result).toBe('{"approved": false}')
    })

    test('returns raw response when no JSON code block found', () => {
      mockExecFileSync.mockReturnValue(
        JSON.stringify({ result: 'Plain text response' })
      )

      const result = client.ask('test prompt')

      expect(result).toBe('Plain text response')
    })

    test('handles response with text before and after JSON block', () => {
      mockExecFileSync.mockReturnValue(
        JSON.stringify({
          result:
            'Here is the analysis:\n```json\n{"approved": true}\n```\nThat concludes the review.',
        })
      )

      const result = client.ask('test prompt')

      expect(result).toBe('{"approved": true}')
    })
  })

  describe('error handling', () => {
    test('throws error when execFileSync fails', () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error('Command failed')
      })

      expect(() => client.ask('test')).toThrow('Command failed')
    })

    test('throws error when response is not valid JSON', () => {
      mockExecFileSync.mockReturnValue('invalid json')

      expect(() => client.ask('test')).toThrow()
    })

    test('throws error when response lacks result field', () => {
      mockExecFileSync.mockReturnValue(JSON.stringify({ error: 'No result' }))

      expect(() => client.ask('test')).toThrow()
    })
  })

  describe('security', () => {
    test('uses execFileSync with system claude when useLocalClaude is false', () => {
      const config = testData.config({ useLocalClaude: false })
      const client = new ClaudeModelClient(config)
      client.ask('test prompt')

      // Should use execFileSync with 'claude' command
      expect(mockExecFileSync).toHaveBeenCalledWith(
        'claude',
        [
          '-',
          '--output-format',
          'json',
          '--max-turns',
          '1',
          '--model',
          'sonnet',
        ],
        expect.objectContaining({
          encoding: 'utf-8',
          timeout: 20000,
          input: 'test prompt',
          cwd: expect.stringContaining('.claude'),
        })
      )
    })

    test('uses execFileSync with local claude path when useLocalClaude is true', () => {
      const config = testData.config({ useLocalClaude: true })
      const client = new ClaudeModelClient(config)
      client.ask('test prompt')

      // Should use execFileSync with full path
      expect(mockExecFileSync).toHaveBeenCalledWith(
        `${process.env.HOME}/.claude/local/claude`,
        [
          '-',
          '--output-format',
          'json',
          '--max-turns',
          '1',
          '--model',
          'sonnet',
        ],
        expect.objectContaining({
          encoding: 'utf-8',
          timeout: 20000,
          input: 'test prompt',
          cwd: expect.stringContaining('.claude'),
        })
      )
    })
  })
})
