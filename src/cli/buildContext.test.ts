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
    const editJson = JSON.stringify({
      file_path: '/src/example.ts',
      content: 'new file content',
    })
    await storage.saveEdit(editJson)
    await storage.saveTest('test code')
    await storage.saveTodo('pending: implement feature')

    const context = await buildContext(storage)

    expect(context).toEqual({
      edit: editJson,
      test: 'test code',
      todo: 'pending: implement feature',
    })
  })
})
