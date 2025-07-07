import {
  HookDataSchema,
  type HookData,
  type ToolInput,
} from '../contracts/schemas/hookData'
import { EditSchema, WriteSchema, TodoWriteSchema, MultiEditSchema, createModificationJson } from '../contracts/schemas/toolSchemas'

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
    if (!toolInput || !toolName) return null

    // Use Zod schemas to validate and extract the correct data
    switch (toolName) {
      case 'Edit': {
        const result = EditSchema.safeParse(toolInput)
        if (result.success) {
          return createModificationJson(result.data)
        }
        break
      }
      
      case 'Write': {
        const result = WriteSchema.safeParse(toolInput)
        if (result.success) {
          return createModificationJson(result.data)
        }
        break
      }
      
      case 'TodoWrite': {
        const result = TodoWriteSchema.safeParse(toolInput)
        if (result.success) {
          return this.extractTodosContent(result.data.todos)
        }
        break
      }
      
      case 'MultiEdit': {
        const result = MultiEditSchema.safeParse(toolInput)
        if (result.success) {
          return createModificationJson(result.data)
        }
        break
      }
    }

    return null
  }

  private extractTodosContent(
    todos: Array<{ content: string; status?: string; priority?: string; id?: string }>
  ): string {
    return todos
      .map((todo) => {
        const status = todo.status || 'pending'
        return `${status}: ${todo.content}`
      })
      .join('\n')
  }
}
