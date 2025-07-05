import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { HookEvents } from './HookEvents'
import { SimpleHookDataSchema, FullHookEventSchema } from './schemas/hookData'

describe('HookEvents', () => {
  const testContent = 'test content'
  const testNewString = 'test new string'

  let sut: Awaited<ReturnType<typeof setupHookEvents>>
  let tempDir: string
  let logFilePath: string

  // Test data factories using Zod schemas
  const createSimpleHookData = {
    withNewString: (content: string) =>
      SimpleHookDataSchema.parse({
        tool_name: 'Edit',
        tool_input: { new_string: content },
      }),

    withContent: (content: string) =>
      SimpleHookDataSchema.parse({
        tool_name: 'Write',
        tool_input: { content },
      }),

    withTodos: (todos: Array<{ content: string; status?: string }>) =>
      SimpleHookDataSchema.parse({
        tool_name: 'TodoWrite',
        tool_input: {
          todos: todos.map((todo, index) => ({
            content: todo.content,
            status: todo.status || 'pending',
            priority: 'medium',
            id: String(index + 1),
          })),
        },
      }),

    empty: () => SimpleHookDataSchema.parse({}),

    withEmptyToolInput: () => SimpleHookDataSchema.parse({ tool_input: {} }),
  }

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
      await sut.logWithTodos([
        {
          content: 'Check existing Husky and commitlint configuration files',
          status: 'pending',
        },
        {
          content: 'Install necessary dependencies for Husky and commitlint',
          status: 'in_progress',
        },
      ])

      const logContent = await sut.readLogContent()
      expect(logContent).toContain(
        'pending: Check existing Husky and commitlint configuration files'
      )
      expect(logContent).toContain(
        'in_progress: Install necessary dependencies for Husky and commitlint'
      )
    })

    test('handles full hook event structure with nested data', async () => {
      const fullHookData = FullHookEventSchema.parse({
        timestamp: '2025-07-05T11:24:53.241Z',
        tool: 'N/A',
        data: {
          session_id: '947d9a0b-108e-47db-a376-b4eb1d2d7533',
          transcript_path: '/Users/name/.claude/projects/test.jsonl',
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
      })

      await sut.logHookData(fullHookData)

      const logContent = await sut.readLogContent()
      expect(logContent).toContain(
        'in_progress: Check existing Husky configuration'
      )
    })

    test('uses pending as default status when not specified', async () => {
      await sut.logWithTodos([
        { content: 'Task without status' },
        { content: 'Another task without status' },
      ])

      const logContent = await sut.readLogContent()
      expect(logContent).toBe(
        'pending: Task without status\npending: Another task without status\n'
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

  describe('edge cases for content extraction', () => {
    test('handles Write tool with content', async () => {
      const writeData = SimpleHookDataSchema.parse({
        tool_name: 'Write',
        tool_input: {
          file_path: '/some/path',
          content: 'file content to write',
        },
      })

      await sut.logHookData(writeData)

      const logContent = await sut.readLogContent()
      expect(logContent).toBe('file content to write\n')
    })

    test('handles Edit tool with new_string', async () => {
      const editData = SimpleHookDataSchema.parse({
        tool_name: 'Edit',
        tool_input: {
          file_path: '/some/path',
          old_string: 'old',
          new_string: 'new edit content',
        },
      })

      await sut.logHookData(editData)

      const logContent = await sut.readLogContent()
      expect(logContent).toBe('new edit content\n')
    })

    test('ignores invalid data structures', async () => {
      await sut.logHookData({ invalid: 'structure' })
      expect(await sut.fileExists()).toBe(false)
    })

    test('ignores non-object data', async () => {
      await sut.logHookData('not an object')
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
      await hookEvents.logHookData(createSimpleHookData.withNewString(content))
    }

    const logWithContent = async (content: string) => {
      await hookEvents.logHookData(createSimpleHookData.withContent(content))
    }

    const logWithTodos = async (
      todos: Array<{ content: string; status?: string }>
    ) => {
      await hookEvents.logHookData(createSimpleHookData.withTodos(todos))
    }

    const logEmpty = async () => {
      await hookEvents.logHookData(createSimpleHookData.empty())
    }

    const logWithEmptyToolInput = async () => {
      await hookEvents.logHookData(createSimpleHookData.withEmptyToolInput())
    }

    return {
      cleanup,
      fileExists,
      readLogContent,
      logWithNewString,
      logWithContent,
      logWithTodos,
      logEmpty,
      logWithEmptyToolInput,
      logHookData: (data: unknown) => hookEvents.logHookData(data),
    }
  }
})
