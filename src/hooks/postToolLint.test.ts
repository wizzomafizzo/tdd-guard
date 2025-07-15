import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handlePostToolLint } from './postToolLint'
import { testData } from '@testUtils'
import { runESLint } from './eslintRunner'
import { MemoryStorage } from '../storage/MemoryStorage'

vi.mock('./eslintRunner', () => ({
  runESLint: vi.fn()
}))

describe('postToolLint', () => {
  const mockRunESLint = vi.mocked(runESLint)
  let storage: MemoryStorage
  const hookData = {
    ...testData.editOperation(),
    hook_event_name: 'PostToolUse',
    tool_output: { success: true }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    storage = new MemoryStorage()

  })

  describe('when handling non-PostToolUse hooks', () => {
    it('should return default result for PreToolUse hooks', async () => {
      const preToolUseHook = {
        ...testData.editOperation(),
        hook_event_name: 'PreToolUse'
      }

      const result = await handlePostToolLint(JSON.stringify(preToolUseHook), storage)

      expect(result).toEqual({
        decision: undefined,
        reason: ''
      })
      expect(mockRunESLint).not.toHaveBeenCalled()
    })

  })

  describe('when extracting file paths', () => {
    it('should extract file path from Edit operations', async () => {
      mockRunESLint.mockResolvedValue(testData.lintDataWithoutErrors())
      const editHook = {
        ...testData.editOperation(),
        hook_event_name: 'PostToolUse'
      }

      await handlePostToolLint(JSON.stringify(editHook), storage)

      expect(mockRunESLint).toHaveBeenCalledWith(['/test/file.ts'])
    })

    it('should extract file path from Write operations', async () => {
      mockRunESLint.mockResolvedValue(testData.lintDataWithoutErrors())
      const writeHook = {
        ...testData.writeOperation(),
        hook_event_name: 'PostToolUse'
      }

      await handlePostToolLint(JSON.stringify(writeHook), storage)

      expect(mockRunESLint).toHaveBeenCalledWith(['/test/file.ts'])
    })

    it('should extract file paths from MultiEdit operations', async () => {
      mockRunESLint.mockResolvedValue(testData.lintDataWithoutErrors())
      const multiEditHook = {
        ...testData.multiEditOperation(),
        hook_event_name: 'PostToolUse'
      }

      await handlePostToolLint(JSON.stringify(multiEditHook), storage)

      expect(mockRunESLint).toHaveBeenCalledWith(['/test/file.ts'])
    })

    it('should return default result when no file paths can be extracted', async () => {
      const hookWithoutPaths = {
        hook_event_name: 'PostToolUse',
        tool_name: 'TodoWrite',
        tool_input: { todos: [] }
      }

      const result = await handlePostToolLint(JSON.stringify(hookWithoutPaths), storage)

      expect(result).toEqual({
        decision: undefined,
        reason: ''
      })
      expect(mockRunESLint).not.toHaveBeenCalled()
    })

    it('should handle missing file_path in edits gracefully', async () => {
      mockRunESLint.mockResolvedValue(testData.lintDataWithoutErrors())
      const multiEditHook = {
        ...testData.multiEditOperation(),
        hook_event_name: 'PostToolUse',
        tool_input: {
          edits: [
            { old_string: 'a', new_string: 'b' },
            { file_path: '/test/file.ts', old_string: 'c', new_string: 'd' }
          ]
        }
      }

      await handlePostToolLint(JSON.stringify(multiEditHook), storage)

      // Should only extract valid file paths
      expect(mockRunESLint).toHaveBeenCalledWith(['/test/file.ts'])
    })
  })

  describe('when running lint check', () => {
    it('should always save lint data to storage', async () => {
      const lintData = testData.lintDataWithError()
      mockRunESLint.mockResolvedValue(lintData)

      await handlePostToolLint(JSON.stringify(hookData), storage)

      const savedLint = await storage.getLint()
      const parsedLint = JSON.parse(savedLint!)
      expect(parsedLint.issues).toEqual(lintData.issues)
      expect(parsedLint.errorCount).toBe(1)
    })
  })

  describe('when lint issues exist', () => {
    beforeEach(() => {
      mockRunESLint.mockResolvedValue(testData.lintDataWithError())
    })

    describe('and notification flag is false', () => {
      it('should not block', async () => {
        const result = await handlePostToolLint(JSON.stringify(hookData), storage)

        expect(result).toEqual({
          decision: undefined,
          reason: ''
        })
      })

      it('should save hasNotifiedAboutLintIssues as false', async () => {
        await handlePostToolLint(JSON.stringify(hookData), storage)

        const savedLint = await storage.getLint()
        const parsedLint = JSON.parse(savedLint!)
        expect(parsedLint.hasNotifiedAboutLintIssues).toBe(false)
      })
    })

    describe('and notification flag is true', () => {
      beforeEach(async () => {
        await storage.saveLint(JSON.stringify(testData.lintDataWithNotificationFlag()))
      })

      it('should block with detailed lint errors', async () => {
        const result = await handlePostToolLint(JSON.stringify(hookData), storage)

        expect(result.decision).toBe('block')
        expect(result.reason).toContain('Lint issues detected:')
      })

      it('should preserve the notification flag', async () => {
        await handlePostToolLint(JSON.stringify(hookData), storage)

        const savedLint = await storage.getLint()
        const parsedLint = JSON.parse(savedLint!)
        expect(parsedLint.hasNotifiedAboutLintIssues).toBe(true)
      })
    })

    describe('and tests are failing (red phase)', () => {
      beforeEach(async () => {
        await storage.saveTest(JSON.stringify(testData.failedTestResults()))
      })

      it('should save lint data without blocking', async () => {
        const lintData = testData.lintDataWithError()
        mockRunESLint.mockResolvedValue(lintData)

        await handlePostToolLint(JSON.stringify(hookData), storage)

        const savedLint = await storage.getLint()
        const parsedLint = JSON.parse(savedLint!)
        expect(parsedLint.issues).toEqual(lintData.issues)
        expect(parsedLint.errorCount).toBe(1)
        expect(parsedLint.hasNotifiedAboutLintIssues).toBe(false)
      })
    })
  })

  describe('when storage errors occur', () => {
    it('should treat storage read errors as no stored lint data', async () => {
      // Make storage.getLint() throw an error only on the first call
      const getLintSpy = vi.spyOn(storage, 'getLint')
      getLintSpy.mockRejectedValueOnce(new Error('Storage error'))
      
      mockRunESLint.mockResolvedValue(testData.lintDataWithoutErrors())

      const result = await handlePostToolLint(JSON.stringify(hookData), storage)

      // Should not block (treats error as no stored data)
      expect(result).toEqual({
        decision: undefined,
        reason: ''
      })
      
      // Reset the spy and check that storage now contains the new lint data
      getLintSpy.mockRestore()
      const savedLint = await storage.getLint()
      expect(savedLint).toBeTruthy()
      const parsedLint = JSON.parse(savedLint!)
      expect(parsedLint.hasNotifiedAboutLintIssues).toBe(false)
      expect(parsedLint.issues).toEqual([])
    })
  })

  describe('when no lint issues exist', () => {
    beforeEach(() => {
      mockRunESLint.mockResolvedValue(testData.lintDataWithoutErrors())
    })

    describe('and previous state had notification flag set', () => {
      beforeEach(async () => {
        await storage.saveLint(JSON.stringify(testData.lintDataWithNotificationFlag()))
      })

      it('should reset hasNotifiedAboutLintIssues to false', async () => {
        await handlePostToolLint(JSON.stringify(hookData), storage)

        const savedLint = await storage.getLint()
        const parsedLint = JSON.parse(savedLint!)
        expect(parsedLint.hasNotifiedAboutLintIssues).toBe(false)
      })

      describe('and tests are passing', () => {
        beforeEach(async () => {
          await storage.saveTest(JSON.stringify(testData.passingTestResults()))
        })

        it('should not block', async () => {
          const result = await handlePostToolLint(JSON.stringify(hookData), storage)

          expect(result).toEqual({
            decision: undefined,
            reason: ''
          })
        })
      })
    })

    describe('and previous state had issues and notification flag', () => {
      beforeEach(async () => {
        await storage.saveLint(JSON.stringify(testData.lintData({
          files: ['/src/example.ts'],
          issues: [testData.lintIssue({ file: '/src/example.ts', line: 1, column: 1, message: "Error" })],
          hasNotifiedAboutLintIssues: true
        })))
      })

      it('should reset hasNotifiedAboutLintIssues to false when issues are resolved', async () => {
        await handlePostToolLint(JSON.stringify(hookData), storage)

        const savedLint = await storage.getLint()
        const parsedLint = JSON.parse(savedLint!)
        expect(parsedLint.hasNotifiedAboutLintIssues).toBe(false)
      })
    })

    it('should save clean lint data', async () => {
      await handlePostToolLint(JSON.stringify(hookData), storage)

      const savedLint = await storage.getLint()
      const parsedLint = JSON.parse(savedLint!)
      expect(parsedLint.issues).toEqual([])
      expect(parsedLint.errorCount).toBe(0)
    })
  })
})