import { describe, it, expect, beforeEach, vi } from 'vitest'
import { processHookData, defaultResult } from './processHookData'
import { MemoryStorage } from '../storage/MemoryStorage'

// Test data constants
const TEST_CONTENT = 'test implementation code'
const TEST_TODO = 'Write tests'

const BLOCK_RESULT = {
  decision: 'block',
  reason: 'TDD violation',
} as const

const WRITE_HOOK_DATA = {
  tool_name: 'Write',
  tool_input: {
    content: TEST_CONTENT,
  },
}

const EDIT_HOOK_DATA = {
  tool_name: 'Edit',
  tool_input: {
    new_string: TEST_CONTENT,
  },
}

const TODO_WRITE_HOOK_DATA = {
  tool_name: 'TodoWrite',
  tool_input: {
    todos: [
      { content: TEST_TODO, status: 'in_progress' },
    ],
  },
}

describe('processHookData', () => {
  let sut: ReturnType<typeof createTestProcessor>

  beforeEach(() => {
    sut = createTestProcessor()
  })

  it('should return a TDDValidationResult', async () => {
    const hookData = { type: 'test', data: 'some data' }

    const result = await sut.process(hookData)

    expect(result).toBeDefined()
    expect(result).toHaveProperty('decision')
    expect(result).toHaveProperty('reason')
  })

  it('should throw error on invalid JSON', async () => {
    const invalidJson = '{ invalid json'

    // For this test, we need to use processHookData directly since we're testing JSON parsing
    await expect(processHookData(invalidJson)).rejects.toThrow()
  })

  it('should save edit content to storage when tool is Edit', async () => {
    await sut.process(EDIT_HOOK_DATA)

    const savedEdit = await sut.getEdit()
    expect(savedEdit).toBe(TEST_CONTENT)
  })

  it('should save todo content to storage when tool is TodoWrite', async () => {
    await sut.process(TODO_WRITE_HOOK_DATA)

    const savedTodo = await sut.getTodo()
    expect(savedTodo).toBe(`in_progress: ${TEST_TODO}`)
  })

  it('should save edit content when tool has content field', async () => {
    await sut.process(WRITE_HOOK_DATA)

    const savedEdit = await sut.getEdit()
    expect(savedEdit).toBe(TEST_CONTENT)
  })

  it('should handle nested data structure with data property', async () => {
    const hookData = createNestedHookData('Edit', {
      new_string: TEST_CONTENT,
    })

    await sut.process(hookData)

    const savedEdit = await sut.getEdit()
    expect(savedEdit).toBe(TEST_CONTENT)
  })

  it('should call tddValidator with context built from storage', async () => {
    // Pre-populate storage
    await sut.populateStorage({
      edit: 'existing edit',
      test: 'existing test',
      todo: 'existing todo',
    })

    const result = await sut.process(EDIT_HOOK_DATA)

    expect(sut.validatorHasBeenCalledWith({
      edit: TEST_CONTENT,
      test: 'existing test',
      todo: 'existing todo',
    })).toBe(true)
    expect(result).toEqual(BLOCK_RESULT)
  })

  it('should not call tddValidator for TodoWrite operations', async () => {
    // Pre-populate storage with existing edits that might cause false blocks
    await sut.populateStorage({
      edit: 'existing edit that might trigger validation',
    })

    const result = await sut.process(TODO_WRITE_HOOK_DATA)

    expect(sut.validatorHasBeenCalled()).toBe(false)
    expect(result).toEqual(defaultResult)
  })

  it('should handle hook data with invalid schema gracefully', async () => {
    // Invalid hook data that doesn't match either SimpleHookDataSchema or FullHookEventSchema
    const invalidHookData = {
      // This doesn't match FullHookEventSchema (missing required fields)
      // and has invalid types for SimpleHookDataSchema
      tool_name: 123, // Should be string
      tool_input: "not an object", // Should be object
    }

    const result = await sut.process(invalidHookData)

    // Should return default result without calling validator
    expect(sut.validatorHasBeenCalled()).toBe(false)
    expect(result).toEqual(defaultResult)
  })
})

// Test setup helper
function createTestProcessor() {
  const storage = new MemoryStorage()
  const mockValidator = vi.fn().mockReturnValue(BLOCK_RESULT)
  
  // Helper to process hook data
  const process = async (hookData: unknown) => {
    return processHookData(JSON.stringify(hookData), { 
      storage, 
      tddValidator: mockValidator 
    })
  }
  
  // Pre-populate storage helper
  const populateStorage = async (data: { edit?: string; test?: string; todo?: string }) => {
    if (data.edit) await storage.saveEdit(data.edit)
    if (data.test) await storage.saveTest(data.test)
    if (data.todo) await storage.saveTodo(data.todo)
  }
  
  return {
    storage,
    process,
    populateStorage,
    
    // Storage accessors
    getEdit: () => storage.getEdit(),
    getTest: () => storage.getTest(),
    getTodo: () => storage.getTodo(),
    
    // Validator checks
    validatorHasBeenCalled: () => mockValidator.mock.calls.length > 0,
    validatorHasBeenCalledWith: (context: Record<string, unknown>) => {
      return mockValidator.mock.calls.some(call => 
        JSON.stringify(call[0]) === JSON.stringify(context)
      )
    },
  }
}

// Test helper functions
function createNestedHookData(tool_name: string, tool_input: Record<string, unknown>) {
  return {
    timestamp: '2024-01-01T00:00:00Z',
    tool: tool_name,
    data: {
      session_id: 'test-session',
      transcript_path: 'test.json',
      hook_event_name: 'PreToolUse',
      tool_name,
      tool_input,
    },
  }
}
