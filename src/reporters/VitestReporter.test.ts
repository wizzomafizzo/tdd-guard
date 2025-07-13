import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { VitestReporter } from './VitestReporter'
import { Storage } from '../storage/Storage'
import { FileStorage } from '../storage/FileStorage'
import { MemoryStorage } from '../storage/MemoryStorage'
import { Config } from '../config/Config'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

describe('VitestReporter', () => {
  let sut: Awaited<ReturnType<typeof setupVitestReporter>>
  const firstTestOutput = 'First test output'
  const secondTestOutput = 'First test output'
  const testOutputs = [firstTestOutput, secondTestOutput]
  const errorMessage = 'Error: Cannot find module'
  const textWithAnsi = '\x1b[32m✓\x1b[39m Test passed \x1b[2m(5ms)\x1b[22m\n'
  const textWithoutAnsi = '✓ Test passed (5ms)\n'

  beforeEach(() => {
    sut = setupVitestReporter()
  })

  afterEach(() => {
    sut.cleanup()
  })

  describe('constructor behavior', () => {
    it('uses FileStorage when no storage provided', async () => {
      const sut = setupVitestReporter({ type: 'file' })

      expect(sut.reporter['storage']).toBeInstanceOf(FileStorage)
      expect(await sut.writeAndGetSaved([firstTestOutput])).toBe(
        firstTestOutput
      )
    })

    it('accepts Storage instance in constructor', () => {
      const storage = new MemoryStorage()
      const reporter = new VitestReporter(storage)
      expect(reporter['storage']).toBe(storage)
    })
  })

  describe('storage integration', () => {
    it('saves test output to storage', async () => {
      expect(await sut.writeAndGetSaved([firstTestOutput])).toBe(
        firstTestOutput
      )
    })

    it('accumulates multiple outputs in storage', async () => {
      expect(await sut.writeAndGetSaved(testOutputs)).toContain(firstTestOutput)
      expect(await sut.writeAndGetSaved(testOutputs)).toContain(
        secondTestOutput
      )
    })
  })

  describe('output capture behavior', () => {
    describe('ansi handling', () => {
      beforeEach(async () => {
        sut.writeOutput(textWithAnsi)
        await sut.reporter.onTestRunEnd()
      })

      it('console output is not stripped of ansi codes', () => {
        expect(sut.getConsoleOutput()).toBe(textWithAnsi)
      })

      it('strips ansi codes from output to file', async () => {
        expect(await sut.storage.getTest()).toBe(textWithoutAnsi)
      })
    })

    describe('stderr capture', () => {
      it('captures and saves stderr output to file', async () => {
        const saved = await sut.writeAndGetSaved([
          { type: 'stderr', content: errorMessage },
        ])

        expect(saved).toContain(errorMessage)
      })
    })
  })
})

function setupVitestReporter(options?: { type: 'file' | 'memory' }) {
  // Console output mocking
  const originalWrite = process.stdout.write.bind(process.stdout)
  const originalErrWrite = process.stderr.write.bind(process.stderr)
  let consoleOutput = ''
  let consoleError = ''
  const mockWrite = vi.fn((chunk: string | Uint8Array) => {
    consoleOutput = chunk?.toString() || ''
    return true
  })
  const mockErrWrite = vi.fn((chunk: string | Uint8Array) => {
    consoleError = chunk?.toString() || ''
    return true
  })
  process.stdout.write = mockWrite
  process.stderr.write = mockErrWrite

  // Test directory setup for FileStorage tests
  let testDir: string | undefined

  // Create storage based on options
  let storage: Storage
  if (options?.type === 'file') {
    const randomId = randomBytes(8).toString('hex')
    testDir = join(tmpdir(), `vitest-reporter-test-${randomId}`)
    const config = new Config({ dataDir: testDir })
    storage = new FileStorage(config)
  } else {
    storage = new MemoryStorage()
  }

  const reporter = new VitestReporter(storage)
  reporter.onInit()

  // Test utilities
  const writeOutput = (output: string) => process.stdout.write(output)
  const writeError = (error: string) => process.stderr.write(error)
  const getConsoleOutput = () => consoleOutput
  const getConsoleError = () => consoleError

  // Helper to write outputs and get saved content
  const writeAndGetSaved = async (
    outputs: Array<string | { type: 'stderr'; content: string }>
  ) => {
    for (const output of outputs) {
      if (typeof output === 'string') {
        writeOutput(output)
      } else {
        writeError(output.content)
      }
    }
    await reporter.onTestRunEnd()
    return storage.getTest()
  }

  // Cleanup function
  const cleanup = () => {
    process.stdout.write = originalWrite
    process.stderr.write = originalErrWrite
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true })
    }
  }

  return {
    // Reporter
    reporter,
    writeOutput,
    writeError,
    writeAndGetSaved,

    // Storage
    storage,

    // Console output
    getConsoleOutput,
    getConsoleError,

    // Lifecycle
    cleanup,
  }
}
