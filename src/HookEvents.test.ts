import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { HookEvents } from './HookEvents'

describe('HookEvents', () => {
  const testContent = 'test content'
  const testNewString = 'test new string'

  let sut: Awaited<ReturnType<typeof setupHookEvents>>
  let tempDir: string
  let logFilePath: string

  // Test data factory
  const createTodoWriteData = (
    todos: Array<{
      content: string
      status?: string
      priority?: string
      id?: string
    }>
  ) => ({
    tool_name: 'TodoWrite',
    tool_input: {
      todos: todos.map((todo, index) => ({
        content: todo.content,
        status: todo.status || 'pending',
        priority: todo.priority || 'medium',
        id: todo.id || String(index + 1),
      })),
    },
  })

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hook-events-test-'))
    logFilePath = path.join(tempDir, 'test.log')
    sut = await setupHookEvents(logFilePath)
  })

  afterEach(async () => {
    await sut.cleanup()
  })

  describe('with logged content', () => {
    beforeEach(async () => {
      await sut.logWithNewString(testNewString)
      await sut.logWithContent(testContent)
    })

    test('creates the specified log file', async () => {
      expect(await sut.fileExists()).toBe(true)
    })

    test('logs content from hook data with new_string property', async () => {
      expect(await sut.readLogContent()).toContain(testNewString)
    })

    test('logs content from hook data with content property', async () => {
      expect(await sut.readLogContent()).toContain(testContent)
    })

    describe('when reading the log content', () => {
      let logContent: string

      beforeEach(async () => {
        logContent = await sut.readLogContent()
      })

      test('contains the first entry', async () => {
        expect(logContent).toContain(testNewString)
      })

      test('contains the second entry', async () => {
        expect(logContent).toContain(testContent)
      })

      test('preserves order of entries', async () => {
        const firstIndex = logContent.indexOf(testNewString)
        const secondIndex = logContent.indexOf(testContent)

        expect(firstIndex).toBeLessThan(secondIndex)
      })

      test('separates entries with newline', async () => {
        expect(logContent).toContain('\n')
      })
    })
  })

  describe('when logging TodoWrite data', () => {
    test('logs todos with status prefix', async () => {
      const todoData = createTodoWriteData([
        {
          content: 'Check existing Husky and commitlint configuration files',
          status: 'pending',
          priority: 'high',
        },
        {
          content: 'Install necessary dependencies for Husky and commitlint',
          status: 'in_progress',
          priority: 'high',
        },
      ])

      await sut.logHookData(todoData)

      const logContent = await sut.readLogContent()
      expect(logContent).toContain(
        'pending: Check existing Husky and commitlint configuration files'
      )
      expect(logContent).toContain(
        'in_progress: Install necessary dependencies for Husky and commitlint'
      )
    })

    test('handles full hook event structure with nested data', async () => {
      const fullHookData = {
        timestamp: '2025-07-05T11:24:53.241Z',
        tool: 'N/A',
        data: {
          session_id: '947d9a0b-108e-47db-a376-b4eb1d2d7533',
          transcript_path:
            '/Users/name/.claude/projects/-Users-name-projects-TDDetective/947d9a0b-108e-47db-a376-b4eb1d2d7533.jsonl',
          hook_event_name: 'PreToolUse',
          tool_name: 'TodoWrite',
          tool_input: {
            todos: [
              {
                content: 'Check existing Husky configuration',
                status: 'in_progress',
                priority: 'high',
                id: '1',
              },
            ],
          },
        },
      }

      await sut.logHookData(fullHookData)

      const logContent = await sut.readLogContent()
      expect(logContent).toContain(
        'in_progress: Check existing Husky configuration'
      )
    })
  })

  describe('when hook data has no content', () => {
    test('does not create file when tool_input is missing', async () => {
      await sut.logEmpty()

      expect(await sut.fileExists()).toBe(false)
    })

    test('does not create file when tool_input is empty', async () => {
      await sut.logWithEmptyToolInput()

      expect(await sut.fileExists()).toBe(false)
    })
  })

  // Test helper
  async function setupHookEvents(logFilePath: string) {
    const hookEvents = new HookEvents(logFilePath)

    const cleanup = async () => {
      await fs.rm(tempDir, { recursive: true, force: true })
    }

    const fileExists = async () => {
      return fs
        .access(logFilePath)
        .then(() => true)
        .catch(() => false)
    }

    const readLogContent = async () => {
      return fs.readFile(logFilePath, 'utf-8')
    }

    const logWithNewString = async (content: string) => {
      await hookEvents.logHookData({
        tool_input: { new_string: content },
      })
    }

    const logWithContent = async (content: string) => {
      await hookEvents.logHookData({
        tool_input: { content },
      })
    }

    const logEmpty = async () => {
      await hookEvents.logHookData({})
    }

    const logWithEmptyToolInput = async () => {
      await hookEvents.logHookData({ tool_input: {} })
    }

    return {
      cleanup,
      fileExists,
      readLogContent,
      logWithNewString,
      logWithContent,
      logEmpty,
      logWithEmptyToolInput,
      logHookData: (data: unknown) => hookEvents.logHookData(data),
    }
  }
})
