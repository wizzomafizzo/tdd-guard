import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { HookEvents } from './HookEvents'
import { SimpleHookDataSchema, FullHookEventSchema } from '../contracts/schemas/hookData'
import { MemoryStorage } from '../storage/MemoryStorage'

describe('HookEvents', () => {
  const testContent = 'test content'
  const testNewString = 'test new string'

  let sut: Awaited<ReturnType<typeof setupHookEvents>>

  beforeEach(async () => {
    sut = await setupHookEvents()
  })

  afterEach(async () => {
    await sut.cleanup()
  })

  describe('with logged content', () => {
    beforeEach(async () => {
      await sut.logHookData(
        testDataFactory.writeEvent({ content: testContent })
      )
    })

    test('saves content to storage', async () => {
      expect(await sut.editsExist()).toBe(true)
    })

    test('logs content from Write tool', async () => {
      expect(await sut.readEdits()).toBe(testContent)
    })
  })

  describe('with Edit tool', () => {
    test('logs content from new_string property', async () => {
      await sut.logHookData(
        testDataFactory.editEvent({ content: testNewString })
      )

      expect(await sut.readEdits()).toBe(testNewString)
    })
  })

  describe('when logging TodoWrite data', () => {
    test('saves todo content to storage', async () => {
      await sut.logHookData(testDataFactory.todosEvent())

      expect(await sut.todosExist()).toBe(true)
    })

    test('does not save edit content', async () => {
      await sut.logHookData(testDataFactory.todosEvent())

      expect(await sut.editsExist()).toBe(false)
    })

    test('logs todos with status prefix', async () => {
      await sut.logHookData(testDataFactory.todosEvent())

      const logContent = await sut.readTodos()
      expect(logContent).toContain('pending: First default task')
      expect(logContent).toContain('in_progress: Second default task')
    })

    test('handles full hook event structure with nested data', async () => {
      const fullHookData = testDataFactory.fullTodoEvent()

      await sut.logHookData(fullHookData)

      const logContent = await sut.readTodos()
      expect(logContent).toContain(
        'in_progress: Check existing Husky configuration'
      )
    })

    test('logs single todo with default status', async () => {
      const todoData = testDataFactory.todoEvent()

      await sut.logHookData(todoData)

      const logContent = await sut.readTodos()
      expect(logContent).toContain('pending: Default todo task')
    })
  })

  describe('when hook data has no content', () => {
    test('does not create file when tool_input is missing', async () => {
      await sut.logHookData(testDataFactory.emptyEvent())

      expect(await sut.editsExist()).toBe(false)
    })

    test('does not create file when tool_input is empty', async () => {
      await sut.logHookData(testDataFactory.emptyToolInputEvent())

      expect(await sut.editsExist()).toBe(false)
    })
  })

  describe('overwrite behavior', () => {
    test('overwrites previous content instead of appending', async () => {
      // First write
      await sut.logHookData(
        testDataFactory.writeEvent({ content: 'first content' })
      )

      // Second write should overwrite
      await sut.logHookData(
        testDataFactory.writeEvent({ content: 'second content' })
      )

      const logContent = await sut.readEdits()
      expect(logContent).toBe('second content')
      expect(logContent).not.toContain('first content')
    })
  })

  describe('edge cases for content extraction', () => {
    test('handles Write tool with content', async () => {
      const writeData = testDataFactory.writeEvent()

      await sut.logHookData(writeData)

      const logContent = await sut.readEdits()
      expect(logContent).toContain('default write content')
    })

    test('handles Edit tool with new_string', async () => {
      const editData = testDataFactory.editEvent()

      await sut.logHookData(editData)

      const logContent = await sut.readEdits()
      expect(logContent).toContain('default edit content')
    })

    test('ignores invalid data structures', async () => {
      await sut.logHookData({ invalid: 'structure' })
      expect(await sut.editsExist()).toBe(false)
      expect(await sut.todosExist()).toBe(false)
    })

    test('ignores non-object data', async () => {
      await sut.logHookData('not an object')
      expect(await sut.editsExist()).toBe(false)
      expect(await sut.todosExist()).toBe(false)
    })
  })

  // Test helper
  async function setupHookEvents() {
    const storage = new MemoryStorage()
    const hookEvents = new HookEvents(storage)

    const cleanup = async () => {
      // No cleanup needed for memory storage
    }

    const editsExist = async () => {
      const edit = await storage.getEdit()
      return edit !== null
    }

    const todosExist = async () => {
      const todo = await storage.getTodo()
      return todo !== null
    }

    const readEdits = async () => {
      const edit = await storage.getEdit()
      if (edit === null) throw new Error('No edit content')
      return edit
    }

    const readTodos = async () => {
      const todo = await storage.getTodo()
      if (todo === null) throw new Error('No todo content')
      return todo
    }

    return {
      cleanup,
      editsExist,
      todosExist,
      readEdits,
      readTodos,
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
