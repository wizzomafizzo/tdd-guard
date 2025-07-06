import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Storage } from './Storage'
import { MemoryStorage } from './MemoryStorage'
import { FileStorage } from './FileStorage'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe.each(getStorageImplementations())('%s', (name, setupStorage) => {
  let storage: Storage
  let cleanup: (() => Promise<void>) | undefined

  beforeEach(async () => {
    const setup = await setupStorage()
    storage = setup.storage
    cleanup = setup.cleanup
  })

  afterEach(async () => {
    if (cleanup) {
      await cleanup()
    }
  })

  describe('saveTest and getTest', () => {
    it('should store content that can be retrieved', async () => {
      const content = 'test content'

      await storage.saveTest(content)
      const retrieved = await storage.getTest()

      expect(retrieved).toBe(content)
    })
  })

  describe('saveTodo and getTodo', () => {
    it('should store content that can be retrieved', async () => {
      const content = 'todo content'

      await storage.saveTodo(content)
      const retrieved = await storage.getTodo()

      expect(retrieved).toBe(content)
    })
  })

  describe('saveEdit and getEdit', () => {
    it('should store content that can be retrieved', async () => {
      const content = 'edit content'

      await storage.saveEdit(content)
      const retrieved = await storage.getEdit()

      expect(retrieved).toBe(content)
    })
  })

  describe('get methods when no data exists', () => {
    it('should return null when no test data exists', async () => {
      const retrieved = await storage.getTest()
      expect(retrieved).toBeNull()
    })

    it('should return null when no todo data exists', async () => {
      const retrieved = await storage.getTodo()
      expect(retrieved).toBeNull()
    })

    it('should return null when no edit data exists', async () => {
      const retrieved = await storage.getEdit()
      expect(retrieved).toBeNull()
    })
  })

  describe('save methods overwrite existing content', () => {
    it('should overwrite existing test content', async () => {
      await storage.saveTest('first content')
      await storage.saveTest('second content')
      const retrieved = await storage.getTest()

      expect(retrieved).toBe('second content')
    })

    it('should overwrite existing todo content', async () => {
      await storage.saveTodo('first content')
      await storage.saveTodo('second content')
      const retrieved = await storage.getTodo()

      expect(retrieved).toBe('second content')
    })

    it('should overwrite existing edit content', async () => {
      await storage.saveEdit('first content')
      await storage.saveEdit('second content')
      const retrieved = await storage.getEdit()

      expect(retrieved).toBe('second content')
    })
  })
})

function getStorageImplementations(): Array<
  [string, () => Promise<{ storage: Storage; cleanup?: () => Promise<void> }>]
> {
  return [
    [
      'MemoryStorage',
      async () => ({
        storage: new MemoryStorage(),
      }),
    ],
    [
      'FileStorage',
      async () => {
        const tempDir = await fs.mkdtemp(
          path.join(os.tmpdir(), 'storage-test-')
        )
        return {
          storage: new FileStorage(tempDir),
          cleanup: async () => {
            await fs.rm(tempDir, { recursive: true, force: true })
          },
        }
      },
    ],
  ]
}
