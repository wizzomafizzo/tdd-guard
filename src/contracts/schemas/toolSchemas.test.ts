import { describe, test, expect } from 'vitest'
import {
  EditSchema,
  WriteSchema,
  TodoWriteSchema,
  TodoSchema,
  ToolOperationSchema,
  isEditOperation,
  parseStoredContent,
} from './toolSchemas'
import { hookDataFactory } from '../../test'

describe('Tool-specific schemas', () => {
  describe('TodoSchema', () => {
    test('validates correct todo structure', () => {
      const todo = {
        content: 'Implement feature',
        status: 'pending',
        priority: 'high',
        id: '123',
      }

      const result = TodoSchema.safeParse(todo)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(todo)
      }
    })

    test('validates todo with only required content field', () => {
      const todo = {
        content: 'Minimal todo',
      }

      const result = TodoSchema.safeParse(todo)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.content).toBe('Minimal todo')
        expect(result.data.status).toBeUndefined()
      }
    })

    test('fails when content is missing', () => {
      const invalidTodo = {
        status: 'pending',
        priority: 'high',
      }

      const result = TodoSchema.safeParse(invalidTodo)

      expect(result.success).toBe(false)
    })
  })

  describe('EditSchema', () => {
    test('validates correct edit input', () => {
      const editData = hookDataFactory.edit()
      const validInput = editData.tool_input

      const result = EditSchema.safeParse(validInput)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validInput)
      }
    })

    test('validates edit input with optional replace_all', () => {
      const editData = hookDataFactory.edit()
      const validInput = {
        ...editData.tool_input,
        replace_all: true,
      }

      const result = EditSchema.safeParse(validInput)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.replace_all).toBe(true)
      }
    })

    test('fails when required fields are missing', () => {
      const invalidInput = hookDataFactory.incompleteEditContent()

      const result = EditSchema.safeParse(invalidInput)

      expect(result.success).toBe(false)
    })
  })

  describe('WriteSchema', () => {
    test('validates correct write input', () => {
      const writeData = hookDataFactory.write()
      const validInput = writeData.tool_input

      const result = WriteSchema.safeParse(validInput)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validInput)
      }
    })

    test('fails when content is missing', () => {
      const invalidInput = hookDataFactory.incompleteWriteContent()

      const result = WriteSchema.safeParse(invalidInput)

      expect(result.success).toBe(false)
    })
  })

  describe('TodoWriteSchema', () => {
    test('validates correct todo input', () => {
      const todoData = hookDataFactory.todoWrite()
      const validInput = todoData.tool_input

      const result = TodoWriteSchema.safeParse(validInput)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.todos).toHaveLength(2) // default factory creates 2 todos
      }
    })

    test('validates todos with minimal fields', () => {
      const todoData = hookDataFactory.todoWrite({
        todos: [
          {
            content: 'Implement feature',
          },
        ],
      })
      const validInput = todoData.tool_input

      const result = TodoWriteSchema.safeParse(validInput)

      expect(result.success).toBe(true)
    })
  })
})

describe('Discriminated union schemas', () => {
  test('validates Edit operation', () => {
    const editOperation = hookDataFactory.edit()

    const result = ToolOperationSchema.safeParse(editOperation)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tool_name).toBe('Edit')
    }
  })

  test('validates Write operation', () => {
    const writeOperation = hookDataFactory.write()

    const result = ToolOperationSchema.safeParse(writeOperation)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tool_name).toBe('Write')
    }
  })

  test('rejects invalid tool_name', () => {
    const invalidOperation = hookDataFactory.invalidToolName()

    const result = ToolOperationSchema.safeParse(invalidOperation)

    expect(result.success).toBe(false)
  })

  test('validates correct fields for each tool type', () => {
    const editWithWrongFields = hookDataFactory.editWithWrongFields()

    const result = ToolOperationSchema.safeParse(editWithWrongFields)

    expect(result.success).toBe(false)
  })
})

describe('Stored content schemas', () => {
  test('validates stored edit content using EditSchema', () => {
    const editData = hookDataFactory.edit()
    const storedEdit = editData.tool_input

    const result = EditSchema.safeParse(storedEdit)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(storedEdit)
    }
  })

  test('validates stored write content using WriteSchema', () => {
    const writeData = hookDataFactory.write()
    const storedWrite = writeData.tool_input

    const result = WriteSchema.safeParse(storedWrite)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(storedWrite)
    }
  })
})

describe('Type guards', () => {
  test('isEditOperation identifies edit operations', () => {
    const editData = hookDataFactory.edit()
    const editContent = editData.tool_input

    expect(isEditOperation(editContent)).toBe(true)
  })

  test('isEditOperation rejects non-edit operations', () => {
    const writeData = hookDataFactory.write()
    const writeContent = writeData.tool_input

    expect(isEditOperation(writeContent)).toBe(false)
  })

  test('isEditOperation rejects invalid content', () => {
    const invalidContent = hookDataFactory.incompleteEditContent()

    expect(isEditOperation(invalidContent)).toBe(false)
  })
})

describe('Parsing helpers', () => {
  test('parseStoredContent parses valid edit JSON', () => {
    const editData = hookDataFactory.edit()
    const editJson = JSON.stringify(editData.tool_input)

    const result = parseStoredContent(editJson)

    expect(result).toEqual(editData.tool_input)
  })
})
