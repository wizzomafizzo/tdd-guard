import { describe, test, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import { HookEvents } from './HookEvents'
import { MemoryStorage } from '../storage/MemoryStorage'
import { hookDataFactory } from '../test'
import { EditSchema, WriteSchema } from '../contracts/schemas/toolSchemas'
import { FullHookEventSchema } from '../contracts/schemas/hookData'

describe('HookEvents', () => {
  const testContent = 'test content'
  const testNewString = 'test new string'

  let sut: Awaited<ReturnType<typeof setupHookEvents>>

  beforeEach(async () => {
    sut = await setupHookEvents()
  })

  describe('with logged content', () => {
    beforeEach(async () => {
      await sut.logHookData(
        hookDataFactory.write({ content: testContent })
      )
    })

    test('saves content to storage', async () => {
      expect(await sut.editsExist()).toBe(true)
    })

    test('logs content from Write tool', async () => {
      const logContent = await sut.readEdits()
      const parsed = JSON.parse(logContent)
      expect(parsed.content).toBe(testContent)
    })
  })

  describe('with Edit tool', () => {
    test('logs content from new_string property', async () => {
      await sut.logHookData(hookDataFactory.edit({ newString: testNewString }))

      const logContent = await sut.readEdits()
      const parsed = JSON.parse(logContent)
      expect(parsed.new_string).toBe(testNewString)
    })
  })

  describe('when logging TodoWrite data', () => {
    test('saves todo content to storage', async () => {
      await sut.logHookData(hookDataFactory.todoWrite())

      expect(await sut.todosExist()).toBe(true)
    })

    test('does not save edit content', async () => {
      await sut.logHookData(hookDataFactory.todoWrite())

      expect(await sut.editsExist()).toBe(false)
    })

    test('logs todos with status prefix', async () => {
      await sut.logHookData(hookDataFactory.todoWrite())

      const logContent = await sut.readTodos()
      expect(logContent).toContain('in_progress: Write tests')
      expect(logContent).toContain('pending: Implement feature')
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
      await sut.logHookData(hookDataFactory.todoWrite())

      const logContent = await sut.readTodos()
      expect(logContent).toContain('in_progress: Write tests')
      expect(logContent).toContain('pending: Implement feature')
    })
  })

  describe('when hook data has no content', () => {
    test('does not create file when tool_input is missing', async () => {
      await sut.logHookData(hookDataFactory.emptyEvent())

      expect(await sut.editsExist()).toBe(false)
    })

    test('does not create file when tool_input is empty', async () => {
      await sut.logHookData(hookDataFactory.emptyToolInputEvent())

      expect(await sut.editsExist()).toBe(false)
    })
  })

  describe('overwrite behavior', () => {
    test('overwrites previous content instead of appending', async () => {
      // First write
      await sut.logHookData(
        hookDataFactory.write({ content: 'first content' })
      )

      // Second write should overwrite
      await sut.logHookData(
        hookDataFactory.write({ content: 'second content' })
      )

      const logContent = await sut.readEdits()
      const parsed = JSON.parse(logContent)
      expect(parsed.content).toBe('second content')
      expect(parsed.content).not.toContain('first content')
    })
  })

  describe('JSON format for Edit logs', () => {
    let parsedContent: z.infer<typeof EditSchema>

    beforeEach(async () => {
      const editData = hookDataFactory.edit({
        newString: 'new content',
        filePath: '/path/to/file.ts',
        oldString: 'old content'
      })
      await sut.logHookData(editData)
      
      const logContent = await sut.readEdits()
      parsedContent = JSON.parse(logContent)
    })

    test('stores valid JSON', () => {
      expect(parsedContent).toBeDefined()
    })

    test('stores file path', () => {
      expect(parsedContent.file_path).toBe('/path/to/file.ts')
    })

    test('stores old_string', () => {
      expect(parsedContent.old_string).toBe('old content')
    })

    test('stores new_string', () => {
      expect(parsedContent.new_string).toBe('new content')
    })
  })

  describe('JSON format for Write logs', () => {
    let parsedContent: z.infer<typeof WriteSchema>

    beforeEach(async () => {
      const writeData = hookDataFactory.write({
        content: 'file content',
        filePath: '/path/to/file.ts'
      })
      await sut.logHookData(writeData)
      
      const logContent = await sut.readEdits()
      parsedContent = JSON.parse(logContent)
    })

    test('stores valid JSON', () => {
      expect(parsedContent).toBeDefined()
    })

    test('stores file path', () => {
      expect(parsedContent.file_path).toBe('/path/to/file.ts')
    })

    test('stores content', () => {
      expect(parsedContent.content).toBe('file content')
    })
  })

  describe('edge cases for content extraction', () => {
    test('handles Write tool with content', async () => {
      await sut.logHookData(hookDataFactory.write())

      const logContent = await sut.readEdits()
      const parsed = JSON.parse(logContent)
      expect(parsed.content).toBe('file content to write')
    })

    test('handles Edit tool with new_string', async () => {
      await sut.logHookData(hookDataFactory.edit())

      const logContent = await sut.readEdits()
      const parsed = JSON.parse(logContent)
      expect(parsed.new_string).toBe('old content; new content')
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
      editsExist,
      todosExist,
      readEdits,
      readTodos,
      logHookData: (data: unknown) => hookEvents.logHookData(data),
    }
  }

  // Test data factories with sensible defaults
  const testDataFactory = {

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
  }
})
