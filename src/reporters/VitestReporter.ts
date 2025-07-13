import type { Reporter } from 'vitest/node'
import { stripVTControlCharacters } from 'node:util'
import { Storage } from '../storage/Storage'
import { FileStorage } from '../storage/FileStorage'

export class VitestReporter implements Reporter {
  private storage: Storage
  private capturedOutput: string = ''

  constructor(storage?: Storage) {
    this.storage = storage || new FileStorage()
  }

  onInit() {
    // Create a proxy handler that captures output
    const createWriteProxy = (originalWrite: typeof process.stdout.write) => {
      return new Proxy(originalWrite, {
        apply: (target, thisArg, args) => {
          const chunk = args[0]
          const str = chunk?.toString() || ''
          // Remove ANSI escape sequences (color codes) from text
          const cleanStr = stripVTControlCharacters(str)
          // Accumulate output
          this.capturedOutput += cleanStr
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

  async onTestRunEnd() {
    // Save accumulated output to storage
    if (this.capturedOutput) {
      await this.storage.saveTest(this.capturedOutput)
    }
  }
}
