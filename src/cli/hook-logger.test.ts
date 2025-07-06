import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

describe('hook-logger CLI', () => {
  let tempDir: string
  let logFilePath: string
  const cliPath = path.join(__dirname, 'hook-logger.ts')

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hook-logger-test-'))
    logFilePath = path.join(tempDir, 'test.log')
    vi.stubEnv('HOOK_LOG_PATH', logFilePath)
  })

  test('has shebang for direct execution', async () => {
    const content = await fs.readFile(cliPath, 'utf-8')
    const firstLine = content.split('\n')[0]

    expect(firstLine).toBe('#!/usr/bin/env node')
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
    vi.unstubAllEnvs()
  })

  test('exits with status 0 on invalid JSON', async () => {
    const invalidJson = '{ invalid json'

    const { exitCode } = await runCli(invalidJson)

    expect(exitCode).toBe(0)
  })

  test('logs content to the specified file', async () => {
    const hookData = {
      tool_name: 'Edit',
      tool_input: {
        new_string: 'test content from CLI',
      },
    }

    await runCli(JSON.stringify(hookData))

    const logContent = await fs.readFile(logFilePath, 'utf-8')
    expect(logContent).toContain('test content from CLI')
  })

  test('logs error to stderr on invalid JSON', async () => {
    const invalidJson = '{ invalid json'

    const { stderr } = await runCli(invalidJson)

    expect(stderr).toContain('Failed to parse hook data')
  })

  async function runCli(
    input: string
  ): Promise<{ exitCode: number; stderr: string }> {
    return new Promise((resolve) => {
      const proc = spawn('npx', ['tsx', cliPath], {
        env: { ...process.env },
      })

      let stderr = ''
      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      proc.stdin.write(input)
      proc.stdin.end()

      proc.on('close', (code) => {
        resolve({ exitCode: code ?? 1, stderr })
      })
    })
  }
})
