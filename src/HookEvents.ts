import fs from 'fs/promises'
import path from 'path'
import {
  HookDataSchema,
  type HookData,
  type ToolInput,
} from './schemas/hookData'

export type { HookData }

export class HookEvents {
  constructor(private logDirPath: string) {}

  async ensureLogFile(fileName: string): Promise<void> {
    await fs.mkdir(this.logDirPath, { recursive: true })
    const logFilePath = path.join(this.logDirPath, fileName)
    await fs.writeFile(logFilePath, '', { flag: 'a' })
  }

  async logHookData(rawData: unknown): Promise<void> {
    const parseResult = HookDataSchema.safeParse(rawData)

    if (!parseResult.success) {
      return
    }

    const hookData = parseResult.data
    const toolName =
      'data' in hookData ? hookData.data.tool_name : hookData.tool_name
    const toolInput =
      'data' in hookData ? hookData.data.tool_input : hookData.tool_input

    const content = this.extractContent(toolInput)

    if (content !== null) {
      const fileName = toolName === 'TodoWrite' ? 'todo.txt' : 'edit.txt'
      await this.ensureLogFile(fileName)
      const logFilePath = path.join(this.logDirPath, fileName)
      await fs.appendFile(logFilePath, content + '\n---\n')
    }
  }

  private extractContent(toolInput?: ToolInput): string | null {
    if (!toolInput) return null

    // Content extractors in priority order
    const extractors: Array<(input: ToolInput) => string | null> = [
      (input) => input.new_string ?? null,
      (input) => input.content ?? null,
      (input) => this.extractTodosContent(input.todos),
    ]

    for (const extractor of extractors) {
      const content = extractor(toolInput)
      if (content !== null) return content
    }

    return null
  }

  private extractTodosContent(
    todos?: Array<{ content: string; status?: string }>
  ): string | null {
    if (!todos || todos.length === 0) return null

    return todos
      .map((todo) => {
        const status = todo.status || 'pending'
        return `${status}: ${todo.content}`
      })
      .join('\n')
  }
}
