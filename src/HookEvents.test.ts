import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { HookEvents } from './HookEvents'

describe('HookEvents', () => {
  let tempDir: string
  let logFilePath: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hook-events-test-'))
    logFilePath = path.join(tempDir, 'test.log')
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  test('creates the specified log file', async () => {
    const hookEvents = new HookEvents(logFilePath)

    await hookEvents.ensureLogFile()

    const fileExists = await fs
      .access(logFilePath)
      .then(() => true)
      .catch(() => false)

    expect(fileExists).toBe(true)
  })

  test('logs content from hook data with new_string property', async () => {
    const hookEvents = new HookEvents(logFilePath)
    const hookData = {
      tool_input: {
        new_string: 'test content from edit operation',
      },
    }

    await hookEvents.logHookData(hookData)

    const logContent = await fs.readFile(logFilePath, 'utf-8')
    expect(logContent).toBe('test content from edit operation')
  })

  test('logs content from hook data with content property', async () => {
    const hookEvents = new HookEvents(logFilePath)
    const hookData = {
      tool_input: {
        content: 'test content from write operation',
      },
    }

    await hookEvents.logHookData(hookData)

    const logContent = await fs.readFile(logFilePath, 'utf-8')
    expect(logContent).toBe('test content from write operation')
  })

  test('appends multiple logs to the same file', async () => {
    const hookEvents = new HookEvents(logFilePath)

    await hookEvents.logHookData({
      tool_input: { new_string: 'first log entry' },
    })

    await hookEvents.logHookData({
      tool_input: { content: 'second log entry' },
    })

    const logContent = await fs.readFile(logFilePath, 'utf-8')
    expect(logContent).toBe('first log entrysecond log entry')
  })

  test('creates directory and file when logging if they do not exist', async () => {
    // Create a path with a non-existent subdirectory
    const nonExistentDir = path.join(tempDir, 'subdir', 'another')
    const logFileInNonExistentDir = path.join(nonExistentDir, 'test.log')
    const hookEvents = new HookEvents(logFileInNonExistentDir)

    await hookEvents.logHookData({
      tool_input: { content: 'test content' },
    })

    const fileExists = await fs
      .access(logFileInNonExistentDir)
      .then(() => true)
      .catch(() => false)

    expect(fileExists).toBe(true)
    const logContent = await fs.readFile(logFileInNonExistentDir, 'utf-8')
    expect(logContent).toBe('test content')
  })

  test('does not create file when hook data has no content', async () => {
    const hookEvents = new HookEvents(logFilePath)

    // Test with missing tool_input
    await hookEvents.logHookData({})

    // Test with empty tool_input
    await hookEvents.logHookData({ tool_input: {} })

    const fileExists = await fs
      .access(logFilePath)
      .then(() => true)
      .catch(() => false)

    expect(fileExists).toBe(false)
  })
})
