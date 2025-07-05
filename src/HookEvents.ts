import fs from 'fs/promises'
import path from 'path'
import { HookDataSchema, type HookData } from './schemas/hookData'

export type { HookData }

export class HookEvents {
  constructor(private logFilePath: string) {}

  async ensureLogFile(): Promise<void> {
    const dir = path.dirname(this.logFilePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(this.logFilePath, '', { flag: 'a' })
  }

  async logHookData(rawData: unknown): Promise<void> {
    const parseResult = HookDataSchema.safeParse(rawData)

    if (!parseResult.success) {
      return
    }

    const hookData = parseResult.data
    let content: string | null = null

    // Extract tool_input based on format
    const toolInput =
      'data' in hookData ? hookData.data.tool_input : hookData.tool_input

    if (toolInput) {
      if (toolInput.new_string !== undefined) {
        content = toolInput.new_string
      } else if (toolInput.content !== undefined) {
        content = toolInput.content
      } else if (toolInput.todos) {
        // Extract content from todos array with status prefix
        content = toolInput.todos
          .map((todo) => {
            const status = todo.status || 'pending'
            return `${status}: ${todo.content}`
          })
          .join('\n')
      }
    }

    if (content !== null) {
      await this.ensureLogFile()
      await fs.appendFile(this.logFilePath, content + '\n')
    }
  }
}
