import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ClaudeModelClient } from './ClaudeModelClient'
import { execFileSync } from 'child_process'
import * as fs from 'fs'
import { testData } from '../../test'

vi.mock('child_process')
vi.mock('fs', { spy: true })

const mockExecFileSync = vi.mocked(execFileSync)

describe('ClaudeModelClient', () => {
  let sut: Awaited<ReturnType<typeof createSut>>
  let client: ClaudeModelClient

  beforeEach(() => {
    sut = createSut()
    client = sut.client
  })

  describe('command construction', () => {
    test('uses claude command', () => {
      const call = sut.askAndGetCall()
      expect(call.command).toBe('claude')
    })

    test('uses correct flags', () => {
      const call = sut.askAndGetCall()
      expect(call.args).toEqual([
        '-',
        '--output-format',
        'json',
        '--max-turns',
        '1',
        '--model',
        'sonnet',
      ])
    })
  })

  describe('subprocess configuration', () => {
    test('passes prompt via input option', () => {
      const prompt = 'Does this follow TDD?'
      const call = sut.askAndGetCall(prompt)
      expect(call.options.input).toBe(prompt)
    })

    test('uses utf-8 encoding', () => {
      const call = sut.askAndGetCall()
      expect(call.options.encoding).toBe('utf-8')
    })

    test('sets timeout to 20 seconds', () => {
      const call = sut.askAndGetCall()
      expect(call.options.timeout).toBe(20000)
    })

    test('executes claude command from .claude subdirectory', () => {
      const call = sut.askAndGetCall()
      expect(call.options.cwd).toContain('.claude')
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
      sut.mockResponse('```json\n{"approved": true}\n```')

      const result = client.ask('test prompt')

      expect(result).toBe('{"approved": true}')
    })

    test('handles JSON code blocks with extra whitespace', () => {
      sut.mockResponse('```json  \n\n  {"approved": false}  \n\n```')

      const result = client.ask('test prompt')

      expect(result).toBe('{"approved": false}')
    })

    test('returns raw response when no JSON code block found', () => {
      sut.mockResponse('Plain text response')

      const result = client.ask('test prompt')

      expect(result).toBe('Plain text response')
    })

    test('handles response with text before and after JSON block', () => {
      sut.mockResponse(
        'Here is the analysis:\n```json\n{"approved": true}\n```\nThat concludes the review.'
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
      const localSut = createSut({ useLocalClaude: false })
      localSut.client.ask('test prompt')

      const call = localSut.getLastCall()
      expect(call.command).toBe('claude')
    })

    test('uses execFileSync with local claude path when useLocalClaude is true', () => {
      const localSut = createSut({ useLocalClaude: true })
      localSut.client.ask('test prompt')

      const call = localSut.getLastCall()
      expect(call.command).toBe(`${process.env.HOME}/.claude/local/claude`)
    })
  })
})

// Test Helpers
function createSut(overrides?: Partial<ReturnType<typeof testData.config>>) {
  // Setup mocks
  vi.clearAllMocks()
  mockExecFileSync.mockReturnValue(JSON.stringify({ result: 'test' }))
  vi.spyOn(fs, 'existsSync').mockReturnValue(true)

  const config = testData.config(overrides)
  const client = new ClaudeModelClient(config)

  const mockResponse = (response: string | object) => {
    const jsonResponse =
      typeof response === 'string'
        ? JSON.stringify({ result: response })
        : JSON.stringify(response)
    mockExecFileSync.mockReturnValue(jsonResponse)
  }

  const getLastCall = () => {
    const lastCall =
      mockExecFileSync.mock.calls[mockExecFileSync.mock.calls.length - 1]
    return {
      command: lastCall[0] as string,
      args: lastCall[1] as string[],
      options: lastCall[2] as Record<string, unknown>,
    }
  }

  const askAndGetCall = (prompt = 'test prompt') => {
    client.ask(prompt)
    return getLastCall()
  }

  return {
    client,
    mockResponse,
    getLastCall,
    askAndGetCall,
  }
}
