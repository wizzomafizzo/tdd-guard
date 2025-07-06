import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe('test-logger CLI', () => {
  const cliPath = path.join(__dirname, 'test-logger.ts')
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-logger-test-'))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  test('has shebang for direct execution', async () => {
    const content = await fs.readFile(cliPath, 'utf-8')
    const firstLine = content.split('\n')[0]

    expect(firstLine).toBe('#!/usr/bin/env node')
  })

  test('saves piped input to logs/test.txt', async () => {
    const testContent = 'Test output content'
    const logPath = path.join(tempDir, 'logs', 'test.txt')

    await runTestLogger(testContent, { cwd: tempDir })

    const logContent = await fs.readFile(logPath, 'utf-8')
    expect(logContent).toBe(testContent)
  })

  test('echoes input to stdout', async () => {
    const testContent = 'Test output to echo'

    const { stdout } = await runTestLogger(testContent, { cwd: tempDir })

    expect(stdout).toBe(testContent)
  })

  async function runTestLogger(
    input: string,
    options?: { cwd?: string }
  ): Promise<{ stdout: string }> {
    return new Promise((resolve, reject) => {
      const proc = spawn('npx', ['tsx', cliPath], {
        cwd: options?.cwd || process.cwd(),
      })

      let stdout = ''
      proc.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stdin.write(input)
      proc.stdin.end()

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}`))
        } else {
          resolve({ stdout })
        }
      })
    })
  }
})
