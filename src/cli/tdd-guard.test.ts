import { describe, test, expect, vi, beforeEach } from 'vitest'
import { run } from './tdd-guard'
import { FileStorage } from '../storage/FileStorage'
import { testData } from '../test'

// Mock modules
vi.mock('../hooks/processHookData', () => ({
  processHookData: vi.fn().mockResolvedValue({ decision: 'approve' }),
}))
vi.mock('../storage/FileStorage')

describe('tdd-guard CLI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('uses fileStoragePath from Config for FileStorage', async () => {
    const testConfig = testData.config()

    const mockFileStorage = vi.mocked(FileStorage)

    await run('{}', testConfig)

    expect(mockFileStorage).toHaveBeenCalledWith(
      '.claude/tdd-guard/data/storage'
    )
  })
})
