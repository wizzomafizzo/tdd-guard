import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import { FileStorage } from '../storage/FileStorage'
import { hookDataFactory } from '../test'

describe('tdd-guard CLI', () => {
  let tempDir: string
  let storage: FileStorage
  const cliPath = path.join(__dirname, 'tdd-guard.ts')

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tdd-guard-test-'))
    vi.stubEnv('HOOK_LOG_PATH', tempDir)
    storage = new FileStorage(tempDir)
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
    vi.unstubAllEnvs()
  })

  test('has shebang for direct execution', async () => {
    const content = await fs.readFile(cliPath, 'utf-8')
    const firstLine = content.split('\n')[0]

    expect(firstLine).toBe('#!/usr/bin/env node')
  })

  test('exits with status 0 on invalid JSON', async () => {
    const invalidJson = '{ invalid json'

    const { exitCode } = await runCli(invalidJson)

    expect(exitCode).toBe(0)
  })

  test('saves Edit content', async () => {
    const hookData = hookDataFactory.edit()

    await runCli(JSON.stringify(hookData))

    const savedModifications = await storage.getModifications()
    const parsedModifications = JSON.parse(savedModifications!)
    expect(parsedModifications).toEqual(hookData.tool_input)
  })

  test('saves Write content', async () => {
    const hookData = hookDataFactory.write()

    await runCli(JSON.stringify(hookData))

    const savedModifications = await storage.getModifications()
    const parsedModifications = JSON.parse(savedModifications!)
    expect(parsedModifications).toEqual(hookData.tool_input)
  })

  test('saves TodoWrite content', async () => {
    const hookData = hookDataFactory.todoWrite()

    await runCli(JSON.stringify(hookData))

    const savedTodo = await storage.getTodo()
    expect(savedTodo).toBe(
      'in_progress: Write tests\npending: Implement feature'
    )
  })

  test('saves MultiEdit content', async () => {
    const hookData = hookDataFactory.multiEdit()

    await runCli(JSON.stringify(hookData))

    const savedModifications = await storage.getModifications()
    const parsedModifications = JSON.parse(savedModifications!)

    // The saved data excludes replace_all field
    expect(parsedModifications).toEqual({
      file_path: hookData.tool_input.file_path,
      edits: hookData.tool_input.edits.map(({ old_string, new_string }) => ({
        old_string,
        new_string,
      })),
    })
  })

  test('logs error to stderr on invalid JSON', async () => {
    const invalidJson = '{ invalid json'

    const { stderr } = await runCli(invalidJson)

    expect(stderr).toContain('Failed to parse hook data')
  })

  async function runCli(
    input: string
  ): Promise<{ exitCode: number; stderr: string; stdout: string }> {
    return new Promise((resolve) => {
      const proc = spawn('npx', ['tsx', cliPath], {
        env: { ...process.env },
      })

      let stderr = ''
      let stdout = ''
      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      proc.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stdin.write(input)
      proc.stdin.end()

      proc.on('close', (code) => {
        resolve({ exitCode: code ?? 1, stderr, stdout })
      })
    })
  }
})
