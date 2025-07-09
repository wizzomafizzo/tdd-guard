import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FileReporter } from './FileReporter'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { stripVTControlCharacters } from 'node:util'
import { Config } from '../config/Config'

describe('FileReporter', () => {
  let sut: Awaited<ReturnType<typeof setupFileReporter>>

  const plainText = 'Test output line 1\n'
  const textWithAnsi = '\x1b[32m✓\x1b[39m Test passed \x1b[2m(5ms)\x1b[22m\n'
  const textWithoutAnsi = '✓ Test passed (5ms)\n'

  beforeEach(() => {
    sut = setupFileReporter()
  })

  afterEach(() => {
    sut.cleanup()
  })

  describe('file system operations', () => {
    it('directory does not exist before initialization', () => {
      expect(sut.dirExists()).toBe(false)
    })

    it('creates directory on initialization', () => {
      sut.reporter.onInit()
      expect(sut.dirExists()).toBe(true)
    })
  })

  describe('constructor behavior', () => {
    it('uses Config default path when no path provided', () => {
      const reporter = new FileReporter()
      const config = new Config()
      expect(reporter['outputPath']).toBe(config.testReportPath)
    })

    it('uses provided path when specified', () => {
      const customPath = '/custom/path/test.txt'
      const reporter = new FileReporter(customPath)
      expect(reporter['outputPath']).toBe(customPath)
    })
  })

  describe('output capture behavior', () => {
    beforeEach(() => {
      sut.reporter.onInit()
    })

    describe('file writing', () => {
      beforeEach(() => {
        sut.writeOutput(plainText)
      })

      it('creates file when writing output', () => {
        expect(sut.fileExists()).toBe(true)
      })

      it('saves exact output to file', () => {
        expect(sut.getFileContent()).toBe(plainText)
      })
    })

    describe('ansi handling', () => {
      beforeEach(() => {
        sut.writeOutput(textWithAnsi)
      })

      it('console output is not stripped of ansi codes', () => {
        expect(sut.getConsoleOutput()).toBe(textWithAnsi)
      })

      it('file content matches stripped console output', () => {
        const strippedConsoleOutput = stripVTControlCharacters(
          sut.getConsoleOutput()
        )

        expect(sut.getFileContent()).toBe(strippedConsoleOutput)
      })

      it('strips ansi codes from output to file', () => {
        expect(sut.getFileContent()).toBe(textWithoutAnsi)
      })
    })
  })
})

function setupFileReporter() {
  // Test file setup
  const randomId = randomBytes(8).toString('hex')
  const testDir = join(tmpdir(), `file-reporter-test-${randomId}`)
  const testFile = join(testDir, 'test-output.txt')

  // Console output mocking
  const originalWrite = process.stdout.write.bind(process.stdout)
  let consoleOutput = ''
  const mockWrite = vi.fn((chunk: string | Uint8Array) => {
    consoleOutput = chunk?.toString() || ''
    return true
  })
  process.stdout.write = mockWrite

  // Create reporter instance
  const reporter = new FileReporter(testFile)

  // Test utilities
  const dirExists = () => existsSync(testDir)
  const fileExists = () => existsSync(testFile)
  const getFileContent = () => readFileSync(testFile, 'utf-8')
  const writeOutput = (output: string) => process.stdout.write(output)
  const getConsoleOutput = () => consoleOutput

  // Cleanup function
  const cleanup = () => {
    process.stdout.write = originalWrite
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  }

  return {
    // File system
    testDir,
    testFile,
    dirExists,
    fileExists,
    getFileContent,

    // Reporter
    reporter,
    writeOutput,

    // Console output
    getConsoleOutput,

    // Lifecycle
    cleanup,
  }
}
