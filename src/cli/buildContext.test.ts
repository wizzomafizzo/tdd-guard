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
      modifications: '',
      test: '',
      todo: '',
    })
  })

  it('should return context with values from storage', async () => {
    await storage.saveModifications('some modifications content')
    await storage.saveTest('test code')
    await storage.saveTodo('pending: implement feature')

    const context = await buildContext(storage)

    expect(context).toEqual({
      modifications: 'some modifications content',
      test: 'test code',
      todo: 'pending: implement feature',
    })
  })

  it('should parse modifications JSON data when valid JSON is stored', async () => {
    const modificationsData = {
      file_path: '/src/example.ts',
      content: 'new file content',
    }
    const modificationsJson = JSON.stringify(modificationsData)
    await storage.saveModifications(modificationsJson)
    await storage.saveTest('test code')
    await storage.saveTodo('pending: implement feature')

    const context = await buildContext(storage)

    expect(context).toEqual({
      modifications: JSON.stringify(modificationsData, null, 2),
      test: 'test code',
      todo: 'pending: implement feature',
    })
  })

  it('should pretty-print modifications JSON for better readability', async () => {
    const modificationsData = {
      file_path: '/src/Calculator.test.ts',
      old_string:
        "describe('Calculator', () => {\n  test('should add two numbers correctly', () => {\n    const result = calculator.add(2, 3)\n    expect(result).toBe(5)\n  })\n})",
      new_string:
        "describe('Calculator', () => {\n  test('should add two numbers correctly', () => {\n    const result = calculator.add(2, 3)\n    expect(result).toBe(5)\n  })\n  \n  test('should divide two numbers correctly', () => {\n    const result = calculator.divide(4, 2)\n    expect(result).toBe(2)\n  })\n})",
    }
    await storage.saveModifications(JSON.stringify(modificationsData))

    const context = await buildContext(storage)

    // Should be pretty-printed, not a compact JSON string
    expect(context.modifications).toBe(
      JSON.stringify(modificationsData, null, 2)
    )
  })
})
