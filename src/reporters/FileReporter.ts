import type { Reporter } from 'vitest/node'
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { Config } from '../config/Config'

export class FileReporter implements Reporter {
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

    const originalWrite = process.stdout.write.bind(process.stdout)
    process.stdout.write = new Proxy(originalWrite, {
      apply: (target, thisArg, args) => {
        const chunk = args[0]
        const str = chunk?.toString() || ''
        // Remove ANSI escape sequences (color codes) from text
        const cleanStr = stripVTControlCharacters(str)
        appendFileSync(this.outputPath, cleanStr)
        return Reflect.apply(target, thisArg, args)
      },
    }) as typeof process.stdout.write
  }
}
