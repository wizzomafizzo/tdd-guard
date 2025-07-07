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
      expect(await storage.getTest()).toBe(content)
    })
  })

  describe('saveTodo and getTodo', () => {
    it('should store content that can be retrieved', async () => {
      const content = 'todo content'

      await storage.saveTodo(content)
      expect(await storage.getTodo()).toBe(content)
    })
  })

  describe('saveEdit and getEdit', () => {
    it('should store content that can be retrieved', async () => {
      const content = 'edit content'

      await storage.saveEdit(content)
      expect(await storage.getEdit()).toBe(content)
    })
  })

  describe('get methods when no data exists', () => {
    it('should return null when no test data exists', async () => {
      expect(await storage.getTest()).toBeNull()
    })

    it('should return null when no todo data exists', async () => {
      expect(await storage.getTodo()).toBeNull()
    })

    it('should return null when no edit data exists', async () => {
      expect(await storage.getEdit()).toBeNull()
    })
  })

  describe('save methods overwrite existing content', () => {
    beforeEach(async () => {
      await storage.saveTest('first content')
      await storage.saveTodo('first content')
      await storage.saveEdit('first content')
      await storage.saveTest('second content')
      await storage.saveTodo('second content')
      await storage.saveEdit('second content')
    })

    it('should overwrite existing test content', async () => {
      expect(await storage.getTest()).toBe('second content')
    })

    it('should overwrite existing todo content', async () => {
      expect(await storage.getTodo()).toBe('second content')
    })

    it('should overwrite existing edit content', async () => {
      expect(await storage.getEdit()).toBe('second content')
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
