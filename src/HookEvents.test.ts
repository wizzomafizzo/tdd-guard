import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { HookEvents } from './HookEvents'

describe('HookEvents', () => {
  const testContent = 'test content'
  const testNewString = 'test new string'

  let sut: Awaited<ReturnType<typeof setupHookEvents>>
  let tempDir: string
  let logFilePath: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hook-events-test-'))
    logFilePath = path.join(tempDir, 'test.log')
    sut = await setupHookEvents(logFilePath)
  })

  afterEach(async () => {
    await sut.cleanup()
  })

  describe('with logged content', () => {
    beforeEach(async () => {
      await sut.logWithNewString(testNewString)
      await sut.logWithContent(testContent)
    })

    test('creates the specified log file', async () => {
      expect(await sut.fileExists()).toBe(true)
    })

    test('logs content from hook data with new_string property', async () => {
      expect(await sut.readLogContent()).toContain(testNewString)
    })

    test('logs content from hook data with content property', async () => {
      expect(await sut.readLogContent()).toContain(testContent)
    })

    describe('when reading the log content', () => {
      let logContent: string

      beforeEach(async () => {
        logContent = await sut.readLogContent()
      })

      test('contains the first entry', async () => {
        expect(logContent).toContain(testNewString)
      })

      test('contains the second entry', async () => {
        expect(logContent).toContain(testContent)
      })

      test('preserves order of entries', async () => {
        const firstIndex = logContent.indexOf(testNewString)
        const secondIndex = logContent.indexOf(testContent)

        expect(firstIndex).toBeLessThan(secondIndex)
      })

      test('separates entries with newline', async () => {
        expect(logContent).toContain('\n')
      })
    })
  })

  describe('when hook data has no content', () => {
    test('does not create file when tool_input is missing', async () => {
      await sut.logEmpty()

      expect(await sut.fileExists()).toBe(false)
    })

    test('does not create file when tool_input is empty', async () => {
      await sut.logWithEmptyToolInput()

      expect(await sut.fileExists()).toBe(false)
    })
  })

  // Test helper
  async function setupHookEvents(logFilePath: string) {
    const hookEvents = new HookEvents(logFilePath)

    const cleanup = async () => {
      await fs.rm(tempDir, { recursive: true, force: true })
    }

    const fileExists = async () => {
      return fs
        .access(logFilePath)
        .then(() => true)
        .catch(() => false)
    }

    const readLogContent = async () => {
      return fs.readFile(logFilePath, 'utf-8')
    }

    const logWithNewString = async (content: string) => {
      await hookEvents.logHookData({
        tool_input: { new_string: content },
      })
    }

    const logWithContent = async (content: string) => {
      await hookEvents.logHookData({
        tool_input: { content },
      })
    }

    const logEmpty = async () => {
      await hookEvents.logHookData({})
    }

    const logWithEmptyToolInput = async () => {
      await hookEvents.logHookData({ tool_input: {} })
    }

    return {
      cleanup,
      fileExists,
      readLogContent,
      logWithNewString,
      logWithContent,
      logEmpty,
      logWithEmptyToolInput,
    }
  }
})
