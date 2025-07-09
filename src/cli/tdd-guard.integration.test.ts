import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import { FileStorage } from '../storage/FileStorage'
import { testData } from '../test'
import { run } from './tdd-guard'

describe('tdd-guard CLI', () => {
  let tempDir: string
  let storage: FileStorage
  let testConfig: ReturnType<typeof testData.config>
  const cliPath = path.join(__dirname, 'tdd-guard.ts')

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tdd-guard-test-'))
    const storagePath = path.join(tempDir, 'storage')
    testConfig = testData.config({
      dataDir: tempDir,
      fileStoragePath: storagePath,
    })
    storage = new FileStorage(storagePath)
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
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

  test('logs error to stderr on invalid JSON', async () => {
    const invalidJson = '{ invalid json'

    const { stderr } = await runCli(invalidJson)

    expect(stderr).toContain('Failed to parse hook data')
  })

  test('saves Edit data', async () => {
    const hookData = testData.editOperation()

    await run(JSON.stringify(hookData), testConfig)

    const savedModifications = await storage.getModifications()
    expect(JSON.parse(savedModifications!)).toStrictEqual(hookData)
  })

  test('saves Write data', async () => {
    const hookData = testData.writeOperation()

    await run(JSON.stringify(hookData), testConfig)

    const savedModifications = await storage.getModifications()
    expect(JSON.parse(savedModifications!)).toStrictEqual(hookData)
  })

  test('saves TodoWrite data', async () => {
    const hookData = testData.todoWriteOperation()

    await run(JSON.stringify(hookData), testConfig)

    const savedTodos = await storage.getTodo()
    expect(JSON.parse(savedTodos!)).toStrictEqual(hookData)
  })

  test('saves MultiEdit data', async () => {
    const hookData = testData.multiEditOperation()

    await run(JSON.stringify(hookData), testConfig)

    const savedModifications = await storage.getModifications()
    expect(JSON.parse(savedModifications!)).toStrictEqual(hookData)
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
