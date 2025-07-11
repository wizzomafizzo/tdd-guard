import type { Reporter } from 'vitest/node'
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { Config } from '../config/Config'

export class VitestReporter implements Reporter {
  private outputPath: string

  constructor(outputPath?: string) {
    if (outputPath) {
      this.outputPath = outputPath
    } else {
      const config = new Config()
      this.outputPath = config.testReportPath
    }
  }

  onInit() {
    const dir = dirname(this.outputPath)
    mkdirSync(dir, { recursive: true })

    // Create empty file
    writeFileSync(this.outputPath, '')

    // Create a proxy handler that captures output to file
    const createWriteProxy = (originalWrite: typeof process.stdout.write) => {
      return new Proxy(originalWrite, {
        apply: (target, thisArg, args) => {
          const chunk = args[0]
          const str = chunk?.toString() || ''
          // Remove ANSI escape sequences (color codes) from text
          const cleanStr = stripVTControlCharacters(str)
          appendFileSync(this.outputPath, cleanStr)
          return Reflect.apply(target, thisArg, args)
        },
      })
    }

    // Capture both stdout and stderr
    process.stdout.write = createWriteProxy(
      process.stdout.write.bind(process.stdout)
    ) as typeof process.stdout.write
    process.stderr.write = createWriteProxy(
      process.stderr.write.bind(process.stderr)
    ) as typeof process.stderr.write
  }
}
