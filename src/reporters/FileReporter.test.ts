import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FileReporter } from './FileReporter'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomBytes } from 'node:crypto'
import { stripVTControlCharacters } from 'node:util'

describe('FileReporter', () => {
  let testDir: string
  let testFile: string
  let originalWrite: typeof process.stdout.write

  beforeEach(() => {
    // Create a unique temp directory for each test
    const randomId = randomBytes(8).toString('hex')
    testDir = join(tmpdir(), `file-reporter-test-${randomId}`)
    testFile = join(testDir, 'test-output.txt')

    // Save original stdout.write
    originalWrite = process.stdout.write.bind(process.stdout)
  })

  afterEach(() => {
    // Restore original stdout.write
    process.stdout.write = originalWrite

    // Clean up temp directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('creates directory if it does not exist', () => {
    const reporter = new FileReporter(testFile)

    expect(existsSync(testDir)).toBe(false)

    reporter.onInit()

    expect(existsSync(testDir)).toBe(true)
  })

  it('saves output to provided file path', () => {
    const reporter = new FileReporter(testFile)

    reporter.onInit()

    // Simulate writing to stdout
    const testOutput = 'Test output line 1\n'
    process.stdout.write(testOutput)

    // Check if file was created and contains the output
    expect(existsSync(testFile)).toBe(true)
    const fileContent = readFileSync(testFile, 'utf-8')
    expect(fileContent).toBe(testOutput)
  })

  it('strips ansi codes from output to file', () => {
    const reporter = new FileReporter(testFile)

    reporter.onInit()

    // Simulate writing colored output with ANSI codes
    const coloredOutput = '\x1b[32m✓\x1b[39m Test passed \x1b[2m(5ms)\x1b[22m\n'
    const expectedClean = '✓ Test passed (5ms)\n'

    process.stdout.write(coloredOutput)

    // Check that file contains clean text without ANSI codes
    const fileContent = readFileSync(testFile, 'utf-8')
    expect(fileContent).toBe(expectedClean)
  })

  it('console output is shown', () => {
    const reporter = new FileReporter(testFile)

    // Spy on the original stdout.write to verify it gets called
    const writeSpy = vi.spyOn(process.stdout, 'write')

    reporter.onInit()

    const testOutput = 'Console test output\n'
    process.stdout.write(testOutput)

    // Verify that the original write method was called with our output
    expect(writeSpy).toHaveBeenCalledWith(testOutput)
  })

  it('console output is not stripped of ansi codes', () => {
    const reporter = new FileReporter(testFile)

    // Create a mock to capture what gets passed to the real stdout
    const mockWrite = vi.fn()
    const realOriginalWrite = originalWrite
    process.stdout.write = mockWrite

    reporter.onInit()

    // Now our reporter has wrapped stdout.write, so restore and test
    const coloredOutput = '\x1b[32m✓\x1b[39m Test passed\n'
    process.stdout.write(coloredOutput)

    // Verify the mock (which represents the original stdout) received colored output
    expect(mockWrite).toHaveBeenCalledWith(coloredOutput)

    // Restore
    process.stdout.write = realOriginalWrite
  })

  it('console output and text file content are the same when ansi is stripped', () => {
    const reporter = new FileReporter(testFile)

    // Capture what goes to console
    let consoleOutput = ''
    const mockWrite = vi.fn((chunk: string | Uint8Array) => {
      consoleOutput = chunk?.toString() || ''
      return true
    })
    const realOriginalWrite = originalWrite
    process.stdout.write = mockWrite

    reporter.onInit()

    // Write colored output
    const coloredOutput =
      '\x1b[31mError:\x1b[39m Test \x1b[33mfailed\x1b[39m with \x1b[2mcode 1\x1b[22m\n'
    process.stdout.write(coloredOutput)

    // Read file content
    const fileContent = readFileSync(testFile, 'utf-8')

    // Strip ANSI from console output for comparison
    const strippedConsoleOutput = stripVTControlCharacters(consoleOutput)

    // Verify they match
    expect(fileContent).toBe(strippedConsoleOutput)
    expect(fileContent).toBe('Error: Test failed with code 1\n')

    // Restore
    process.stdout.write = realOriginalWrite
  })
})
