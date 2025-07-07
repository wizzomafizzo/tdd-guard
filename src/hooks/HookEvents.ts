import {
  HookDataSchema,
  type HookData,
} from '../contracts/schemas/hookData'
import { Storage } from '../storage/Storage'

export type { HookData }

// Type for tool input with all possible fields
type ToolInput = {
  new_string?: string
  old_string?: string
  file_path?: string
  content?: string
  todos?: Array<{ content: string; status?: string }>
}

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

    const content = this.extractContent(toolInput, toolName)

    if (content !== null) {
      if (toolName === 'TodoWrite') {
        await this.storage.saveTodo(content)
      } else {
        await this.storage.saveEdit(content)
      }
    }
  }

  private extractContent(toolInput?: ToolInput, toolName?: string): string | null {
    if (!toolInput) return null

    // For TodoWrite, use the existing extraction logic
    if (toolName === 'TodoWrite') {
      return this.extractTodosContent(toolInput.todos)
    }

    // For Edit tool, create JSON with file_path, old_string, new_string
    if (toolName === 'Edit' && toolInput.new_string !== undefined) {
      const editData = {
        file_path: toolInput.file_path,
        old_string: toolInput.old_string,
        new_string: toolInput.new_string
      }
      return JSON.stringify(editData)
    }

    // For Write tool, create JSON with file_path and content
    if (toolName === 'Write' && toolInput.content !== undefined) {
      const writeData = {
        file_path: toolInput.file_path,
        content: toolInput.content
      }
      return JSON.stringify(writeData)
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
