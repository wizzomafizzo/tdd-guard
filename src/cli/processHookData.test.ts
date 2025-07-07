import { describe, it, expect, beforeEach, vi } from 'vitest'
import { processHookData } from './processHookData'
import { MemoryStorage } from '../storage/MemoryStorage'

describe('processHookData', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('should return a TDDValidationResult', async () => {
    const inputData = '{"type":"test","data":"some data"}'

    const result = await processHookData(inputData)

    expect(result).toBeDefined()
    expect(result).toHaveProperty('decision')
    expect(result).toHaveProperty('reason')
  })

  it('should throw error on invalid JSON', async () => {
    const invalidJson = '{ invalid json'

    await expect(processHookData(invalidJson)).rejects.toThrow()
  })

  it('should save edit content to storage when tool is Edit', async () => {
    const hookData = {
      tool_name: 'Edit',
      tool_input: {
        new_string: 'test implementation code',
      },
    }

    await processHookData(JSON.stringify(hookData), { storage })

    const savedEdit = await storage.getEdit()
    expect(savedEdit).toBe('test implementation code')
  })

  it('should save todo content to storage when tool is TodoWrite', async () => {
    const hookData = {
      tool_name: 'TodoWrite',
      tool_input: {
        todos: [
          { content: 'Write tests', status: 'in_progress' },
          { content: 'Implement feature', status: 'pending' },
        ],
      },
    }

    await processHookData(JSON.stringify(hookData), { storage })

    const savedTodo = await storage.getTodo()
    expect(savedTodo).toBe(
      'in_progress: Write tests\npending: Implement feature'
    )
  })

  it('should save edit content when tool has content field', async () => {
    const hookData = {
      tool_name: 'Write',
      tool_input: {
        content: 'file content to write',
      },
    }

    await processHookData(JSON.stringify(hookData), { storage })

    const savedEdit = await storage.getEdit()
    expect(savedEdit).toBe('file content to write')
  })

  it('should handle nested data structure with data property', async () => {
    const hookData = {
      timestamp: '2024-01-01T00:00:00Z',
      tool: 'Edit',
      data: {
        session_id: 'test-session',
        transcript_path: 'test.json',
        hook_event_name: 'PreToolUse',
        tool_name: 'Edit',
        tool_input: {
          new_string: 'nested edit content',
        },
      },
    }

    await processHookData(JSON.stringify(hookData), { storage })

    const savedEdit = await storage.getEdit()
    expect(savedEdit).toBe('nested edit content')
  })

  it('should call tddValidator with context built from storage', async () => {
    const mockValidator = vi.fn().mockReturnValue({
      decision: 'block',
      reason: 'TDD violation',
    })

    // Pre-populate storage
    await storage.saveEdit('existing edit')
    await storage.saveTest('existing test')
    await storage.saveTodo('existing todo')

    const hookData = {
      tool_name: 'Edit',
      tool_input: {
        new_string: 'new code',
      },
    }

    const result = await processHookData(JSON.stringify(hookData), {
      storage,
      tddValidator: mockValidator,
    })

    expect(mockValidator).toHaveBeenCalledWith({
      edit: 'new code',
      test: 'existing test',
      todo: 'existing todo',
    })
    expect(result).toEqual({
      decision: 'block',
      reason: 'TDD violation',
    })
  })
})
