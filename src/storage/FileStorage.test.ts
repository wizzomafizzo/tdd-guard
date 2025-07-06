import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FileStorage } from './FileStorage'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe('FileStorage', () => {
  let tempDirs: string[] = []

  afterEach(async () => {
    // Clean up any temp directories created during tests
    for (const dir of tempDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true })
      } catch {
        // Ignore cleanup errors
      }
    }
    tempDirs = []
  })

  describe('directory creation', () => {
    let tempDir: string
    let nonExistentPath: string
    let storage: FileStorage

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filestorage-test-'))
      tempDirs.push(tempDir)
      nonExistentPath = path.join(tempDir, 'new-directory')
      storage = new FileStorage(nonExistentPath)
    })

    it('should create directory if it does not exist', async () => {
      // Directory should not exist yet
      await expect(fs.access(nonExistentPath)).rejects.toThrow()

      // Save should create the directory
      await storage.saveTest('content')

      // Directory should now exist
      await expect(fs.access(nonExistentPath)).resolves.toBeUndefined()
    })

    it('should save content after creating directory', async () => {
      await storage.saveTest('test content')

      const retrieved = await storage.getTest()
      expect(retrieved).toBe('test content')
    })

    it('should create directory for saveTodo', async () => {
      await expect(fs.access(nonExistentPath)).rejects.toThrow()

      await storage.saveTodo('todo content')

      await expect(fs.access(nonExistentPath)).resolves.toBeUndefined()
      const retrieved = await storage.getTodo()
      expect(retrieved).toBe('todo content')
    })

    it('should create directory for saveEdit', async () => {
      await expect(fs.access(nonExistentPath)).rejects.toThrow()

      await storage.saveEdit('edit content')

      await expect(fs.access(nonExistentPath)).resolves.toBeUndefined()
      const retrieved = await storage.getEdit()
      expect(retrieved).toBe('edit content')
    })
  })
})
