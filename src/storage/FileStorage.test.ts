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
      await fs.rm(dir, { recursive: true, force: true })
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

    it('should create directory for saveModifications', async () => {
      await expect(fs.access(nonExistentPath)).rejects.toThrow()

      await storage.saveModifications('modifications content')

      await expect(fs.access(nonExistentPath)).resolves.toBeUndefined()
      const retrieved = await storage.getModifications()
      expect(retrieved).toBe('modifications content')
    })
  })

  describe('JSON file storage', () => {
    let tempDir: string
    let storage: FileStorage

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), 'filestorage-json-test-')
      )
      tempDirs.push(tempDir)
      storage = new FileStorage(tempDir)
    })

    it('should save modifications to modifications.json instead of modifications.txt', async () => {
      const jsonContent = JSON.stringify({
        file_path: '/test/file.ts',
        content: 'test content',
      })

      await storage.saveModifications(jsonContent)

      // Check that modifications.json exists
      const jsonPath = path.join(tempDir, 'modifications.json')
      await expect(fs.access(jsonPath)).resolves.toBeUndefined()

      // Check that modifications.txt does not exist
      const txtPath = path.join(tempDir, 'modifications.txt')
      await expect(fs.access(txtPath)).rejects.toThrow()

      // Verify content
      const retrieved = await storage.getModifications()
      expect(retrieved).toBe(jsonContent)
    })
  })
})
