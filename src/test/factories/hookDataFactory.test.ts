import { describe, test, expect } from 'vitest'
import { hookDataFactory } from './hookDataFactory'

describe('hookDataFactory', () => {
  describe('write', () => {
    test('creates Write hook data with defaults', () => {
      const result = hookDataFactory.write()

      expect(result).toEqual({
        tool_name: 'Write',
        tool_input: {
          file_path: '/test/newfile.ts',
          content: 'file content to write',
        },
      })
    })

    test('allows overriding file path', () => {
      const result = hookDataFactory.write({
        filePath: '/custom/path.ts',
      })

      expect(result.tool_input.file_path).toBe('/custom/path.ts')
    })

    test('allows overriding content', () => {
      const result = hookDataFactory.write({
        content: 'custom content',
      })

      expect(result.tool_input.content).toBe('custom content')
    })
  })

  describe('edit', () => {
    test('creates Edit hook data with defaults', () => {
      const result = hookDataFactory.edit()

      expect(result).toEqual({
        tool_name: 'Edit',
        tool_input: {
          file_path: '/test/file.ts',
          old_string: 'old content;',
          new_string: 'old content; new content',
        },
      })
    })

    test('allows overriding all fields', () => {
      const result = hookDataFactory.edit({
        filePath: '/custom/edit.ts',
        oldString: 'original',
        newString: 'modified',
      })

      expect(result.tool_input).toEqual({
        file_path: '/custom/edit.ts',
        old_string: 'original',
        new_string: 'modified',
      })
    })
  })

  describe('todoWrite', () => {
    test('creates TodoWrite hook data with defaults', () => {
      const result = hookDataFactory.todoWrite()

      expect(result).toEqual({
        tool_name: 'TodoWrite',
        tool_input: {
          todos: [
            { content: 'Write tests', status: 'in_progress' },
            { content: 'Implement feature', status: 'pending' },
          ],
        },
      })
    })

    test('allows overriding todos', () => {
      const customTodos = [
        { content: 'Custom task 1', status: 'completed' },
        { content: 'Custom task 2', status: 'pending', priority: 'high' },
      ]

      const result = hookDataFactory.todoWrite({ todos: customTodos })

      expect(result.tool_input.todos).toEqual(customTodos)
    })
  })

  describe('multiEdit', () => {
    test('creates MultiEdit hook data with defaults', () => {
      const result = hookDataFactory.multiEdit()

      expect(result).toEqual({
        tool_name: 'MultiEdit',
        tool_input: {
          file_path: '/test/file.ts',
          edits: [
            {
              old_string: 'first old content',
              new_string: 'first new content',
              replace_all: false,
            },
            {
              old_string: 'second old content',
              new_string: 'second new content',
              replace_all: false,
            },
          ],
        },
      })
    })

    test('allows overriding file path', () => {
      const result = hookDataFactory.multiEdit({
        filePath: '/custom/multi.ts',
      })

      expect(result.tool_input.file_path).toBe('/custom/multi.ts')
    })

    test('allows overriding edits', () => {
      const customEdits = [
        {
          old_string: 'custom old',
          new_string: 'custom new',
          replace_all: true,
        },
      ]

      const result = hookDataFactory.multiEdit({ edits: customEdits })

      expect(result.tool_input.edits).toEqual(customEdits)
    })
  })

  describe('invalid data factories', () => {
    test('editWithWrongFields creates Edit with content field', () => {
      const result = hookDataFactory.editWithWrongFields()

      expect(result).toEqual({
        tool_name: 'Edit',
        tool_input: {
          file_path: '/src/example.ts',
          content: 'wrong field for edit',
        },
      })
    })

    test('invalidToolName creates hook data with invalid tool', () => {
      const result = hookDataFactory.invalidToolName()

      expect(result).toEqual({
        tool_name: 'InvalidTool',
        tool_input: {
          file_path: '/src/example.ts',
        },
      })
    })

    test('incompleteEditContent creates content missing required fields', () => {
      const result = hookDataFactory.incompleteEditContent()

      expect(result).toEqual({
        file_path: '/src/example.ts',
      })
      expect(result).not.toHaveProperty('old_string')
      expect(result).not.toHaveProperty('new_string')
    })

    test('incompleteWriteContent creates content missing content field', () => {
      const result = hookDataFactory.incompleteWriteContent()

      expect(result).toEqual({
        file_path: '/src/example.ts',
      })
      expect(result).not.toHaveProperty('content')
    })

    test('writeWithWrongFields creates Write with edit fields', () => {
      const result = hookDataFactory.writeWithWrongFields()

      expect(result).toEqual({
        tool_name: 'Write',
        tool_input: {
          file_path: '/src/newfile.ts',
          old_string: 'old content',
          new_string: 'new content',
        },
      })
    })

    test('emptyEvent creates empty object', () => {
      const result = hookDataFactory.emptyEvent()

      expect(result).toEqual({})
    })

    test('emptyToolInputEvent creates object with empty tool_input', () => {
      const result = hookDataFactory.emptyToolInputEvent()

      expect(result).toEqual({
        tool_input: {},
      })
    })
  })
})
