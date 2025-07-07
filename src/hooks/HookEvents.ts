import {
  HookDataSchema,
  type HookData,
  type ToolInput,
} from '../contracts/schemas/hookData'
import { Storage } from '../storage/Storage'

export type { HookData }

export class HookEvents {
  constructor(private storage: Storage) {}

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
      if (toolName === 'TodoWrite') {
        await this.storage.saveTodo(content)
      } else {
        await this.storage.saveEdit(content)
      }
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
