import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ClaudeModelClient } from './ClaudeModelClient'
import { execSync } from 'child_process'

vi.mock('child_process')

describe('ClaudeModelClient', () => {
  const mockExecSync = vi.mocked(execSync)
  let client: ClaudeModelClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new ClaudeModelClient()
  })

  describe('command construction', () => {
    test('uses correct claude command with all flags', () => {
      mockExecSync.mockReturnValue(JSON.stringify({ result: 'test' }))

      client.ask('test prompt')

      expect(mockExecSync).toHaveBeenCalledWith(
        'claude - --output-format json --max-turns 1 --model sonnet',
        expect.any(Object)
      )
    })
  })

  describe('subprocess configuration', () => {
    test('passes prompt via input option', () => {
      mockExecSync.mockReturnValue(JSON.stringify({ result: 'test' }))
      const prompt = 'Does this follow TDD?'

      client.ask(prompt)

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: prompt,
        })
      )
    })

    test('uses utf-8 encoding', () => {
      mockExecSync.mockReturnValue(JSON.stringify({ result: 'test' }))

      client.ask('test')

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          encoding: 'utf-8',
        })
      )
    })

    test('sets timeout to 20 seconds', () => {
      mockExecSync.mockReturnValue(JSON.stringify({ result: 'test' }))

      client.ask('test')

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 20000,
        })
      )
    })
  })

  describe('response parsing', () => {
    test('extracts JSON from markdown code blocks', () => {
      mockExecSync.mockReturnValue(
        JSON.stringify({ result: '```json\n{"approved": true}\n```' })
      )

      const result = client.ask('test prompt')

      expect(result).toBe('{"approved": true}')
    })

    test('handles JSON code blocks with extra whitespace', () => {
      mockExecSync.mockReturnValue(
        JSON.stringify({
          result: '```json  \n\n  {"approved": false}  \n\n```',
        })
      )

      const result = client.ask('test prompt')

      expect(result).toBe('{"approved": false}')
    })

    test('returns raw response when no JSON code block found', () => {
      mockExecSync.mockReturnValue(
        JSON.stringify({ result: 'Plain text response' })
      )

      const result = client.ask('test prompt')

      expect(result).toBe('Plain text response')
    })

    test('handles response with text before and after JSON block', () => {
      mockExecSync.mockReturnValue(
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
    test('throws error when execSync fails', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed')
      })

      expect(() => client.ask('test')).toThrow('Command failed')
    })

    test('throws error when response is not valid JSON', () => {
      mockExecSync.mockReturnValue('invalid json')

      expect(() => client.ask('test')).toThrow()
    })

    test('throws error when response lacks result field', () => {
      mockExecSync.mockReturnValue(JSON.stringify({ error: 'No result' }))

      expect(() => client.ask('test')).toThrow()
    })
  })
})
