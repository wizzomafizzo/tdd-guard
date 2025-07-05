import fs from 'fs/promises'
import path from 'path'

interface HookData {
  tool_input?: {
    new_string?: string
    content?: string
  }
}

export class HookEvents {
  constructor(private logFilePath: string) {}

  async ensureLogFile(): Promise<void> {
    const dir = path.dirname(this.logFilePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(this.logFilePath, '', { flag: 'a' })
  }

  async logHookData(hookData: HookData): Promise<void> {
    let content: string | null = null

    if (hookData.tool_input) {
      if (hookData.tool_input.new_string !== undefined) {
        content = hookData.tool_input.new_string
      } else if (hookData.tool_input.content !== undefined) {
        content = hookData.tool_input.content
      }
    }

    if (content !== null) {
      await this.ensureLogFile()
      await fs.appendFile(this.logFilePath, content + '\n')
    }
  }
}
