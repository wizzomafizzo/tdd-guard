import { describe, it, expect, beforeEach } from 'vitest'
import { buildContext } from './buildContext'
import { MemoryStorage } from '../storage/MemoryStorage'

describe('buildContext', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('should return a context with empty strings when storage is empty', async () => {
    const context = await buildContext(storage)

    expect(context).toEqual({
      edit: '',
      test: '',
      todo: '',
    })
  })

  it('should return context with values from storage', async () => {
    await storage.saveEdit('some edit content')
    await storage.saveTest('test code')
    await storage.saveTodo('pending: implement feature')

    const context = await buildContext(storage)

    expect(context).toEqual({
      edit: 'some edit content',
      test: 'test code',
      todo: 'pending: implement feature',
    })
  })

  it('should parse edit JSON data when valid JSON is stored', async () => {
    const editData = {
      file_path: '/src/example.ts',
      content: 'new file content',
    }
    const editJson = JSON.stringify(editData)
    await storage.saveEdit(editJson)
    await storage.saveTest('test code')
    await storage.saveTodo('pending: implement feature')

    const context = await buildContext(storage)

    expect(context).toEqual({
      edit: JSON.stringify(editData, null, 2),
      test: 'test code',
      todo: 'pending: implement feature',
    })
  })

  it('should pretty-print edit JSON for better readability', async () => {
    const editData = {
      file_path: '/src/Calculator.test.ts',
      old_string:
        "describe('Calculator', () => {\n  test('should add two numbers correctly', () => {\n    const result = calculator.add(2, 3)\n    expect(result).toBe(5)\n  })\n})",
      new_string:
        "describe('Calculator', () => {\n  test('should add two numbers correctly', () => {\n    const result = calculator.add(2, 3)\n    expect(result).toBe(5)\n  })\n  \n  test('should divide two numbers correctly', () => {\n    const result = calculator.divide(4, 2)\n    expect(result).toBe(2)\n  })\n})",
    }
    await storage.saveEdit(JSON.stringify(editData))

    const context = await buildContext(storage)

    // Should be pretty-printed, not a compact JSON string
    expect(context.edit).toBe(JSON.stringify(editData, null, 2))
  })
})
