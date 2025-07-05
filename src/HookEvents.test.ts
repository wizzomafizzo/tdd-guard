import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { z } from 'zod'
import { HookEvents } from './HookEvents'
import { SimpleHookDataSchema, FullHookEventSchema } from './schemas/hookData'

describe('HookEvents', () => {
  const testContent = 'test content'
  const testNewString = 'test new string'

  let sut: Awaited<ReturnType<typeof setupHookEvents>>
  let tempDir: string
  let logFilePath: string

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
      await sut.logHookData(
        testDataFactory.editEvent({ content: testNewString })
      )
      await sut.logHookData(
        testDataFactory.writeEvent({ content: testContent })
      )
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
      await sut.logHookData(testDataFactory.todosEvent())

      const logContent = await sut.readLogContent()
      expect(logContent).toContain('pending: First default task')
      expect(logContent).toContain('in_progress: Second default task')
    })

    test('handles full hook event structure with nested data', async () => {
      const fullHookData = testDataFactory.fullTodoEvent()

      await sut.logHookData(fullHookData)

      const logContent = await sut.readLogContent()
      expect(logContent).toContain(
        'in_progress: Check existing Husky configuration'
      )
    })

    test('logs single todo with default status', async () => {
      const todoData = testDataFactory.todoEvent()

      await sut.logHookData(todoData)

      const logContent = await sut.readLogContent()
      expect(logContent).toBe('pending: Default todo task\n')
    })
  })

  describe('when hook data has no content', () => {
    test('does not create file when tool_input is missing', async () => {
      await sut.logHookData(testDataFactory.emptyEvent())

      expect(await sut.fileExists()).toBe(false)
    })

    test('does not create file when tool_input is empty', async () => {
      await sut.logHookData(testDataFactory.emptyToolInputEvent())

      expect(await sut.fileExists()).toBe(false)
    })
  })

  describe('edge cases for content extraction', () => {
    test('handles Write tool with content', async () => {
      const writeData = testDataFactory.writeEvent()

      await sut.logHookData(writeData)

      const logContent = await sut.readLogContent()
      expect(logContent).toBe('default write content\n')
    })

    test('handles Edit tool with new_string', async () => {
      const editData = testDataFactory.editEvent()

      await sut.logHookData(editData)

      const logContent = await sut.readLogContent()
      expect(logContent).toBe('default edit content\n')
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

    return {
      cleanup,
      fileExists,
      readLogContent,
      logHookData: (data: unknown) => hookEvents.logHookData(data),
    }
  }

  // Test data factories with sensible defaults
  const testDataFactory = {
    // Simple hook data events with defaults
    editEvent: (overrides?: { content?: string }) => {
      const content = overrides?.content || 'default edit content'
      return SimpleHookDataSchema.parse({
        tool_name: 'Edit',
        tool_input: {
          new_string: content,
        },
      })
    },

    writeEvent: (overrides?: { content?: string }) => {
      const content = overrides?.content || 'default write content'
      return SimpleHookDataSchema.parse({
        tool_name: 'Write',
        tool_input: {
          content,
        },
      })
    },

    todoEvent: (overrides?: { content?: string; status?: string }) => {
      return SimpleHookDataSchema.parse({
        tool_name: 'TodoWrite',
        tool_input: {
          todos: [
            {
              content: overrides?.content || 'Default todo task',
              status: overrides?.status || 'pending',
              priority: 'medium',
              id: '1',
            },
          ],
        },
      })
    },

    todosEvent: (todos?: Array<{ content: string; status?: string }>) => {
      const items = todos || [
        { content: 'First default task', status: 'pending' },
        { content: 'Second default task', status: 'in_progress' },
      ]

      return SimpleHookDataSchema.parse({
        tool_name: 'TodoWrite',
        tool_input: {
          todos: items.map((item, index) => ({
            content: item.content,
            status: item.status || 'pending',
            priority: 'medium',
            id: String(index + 1),
          })),
        },
      })
    },

    // Full hook event with TodoWrite defaults
    fullTodoEvent: (overrides?: {
      content?: string
      status?: string
      timestamp?: string
    }) => {
      return FullHookEventSchema.parse({
        timestamp: overrides?.timestamp || '2025-07-05T11:24:53.241Z',
        tool: 'N/A',
        data: {
          session_id: '947d9a0b-108e-47db-a376-b4eb1d2d7533',
          transcript_path: '/Users/test/.claude/projects/test.jsonl',
          hook_event_name: 'PreToolUse',
          tool_name: 'TodoWrite',
          tool_input: {
            todos: [
              {
                content:
                  overrides?.content || 'Check existing Husky configuration',
                status: overrides?.status || 'in_progress',
                priority: 'high',
                id: '1',
              },
            ],
          },
        },
      })
    },

    emptyEvent: () => SimpleHookDataSchema.parse({}),

    emptyToolInputEvent: () => SimpleHookDataSchema.parse({ tool_input: {} }),

    // Generic factory for custom cases
    customEvent: (data: z.infer<typeof SimpleHookDataSchema>) => {
      return SimpleHookDataSchema.parse(data)
    },
  }
})
