import fs from 'fs/promises'
import path from 'path'

export interface HookData {
  tool_name?: string
  tool_input?: {
    new_string?: string
    content?: string
    todos?: Array<{
      content: string
      status?: string
      priority?: string
      id?: string
    }>
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
      } else if (hookData.tool_input.todos) {
        // Extract content from todos array
        content = hookData.tool_input.todos
          .map((todo) => todo.content)
          .join('\n')
      }
    }

    if (content !== null) {
      await this.ensureLogFile()
      await fs.appendFile(this.logFilePath, content + '\n')
    }
  }
}
