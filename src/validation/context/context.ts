import { Context } from '../../contracts/types/Context'
import {
  isEditOperation,
  isMultiEditOperation,
  isWriteOperation,
  ToolOperation,
  EditOperation,
  MultiEditOperation,
  WriteOperation,
  Todo,
} from '../../contracts/schemas/toolSchemas'
import { prompts } from '../prompts/prompts'

export function generateDynamicContext(context: Context): string {
  const processedContext = processContext(context)

  return [
    prompts.ROLE_PROMPT,
    prompts.TDD_INSTRUCTIONS,
    processedContext,
    prompts.ANSWERING_INSTRUCTIONS,
  ].join('')
}

export function processContext(context: Context): string {
  const operation: ToolOperation = JSON.parse(context.modifications)

  const sections: string[] = [
    formatOperation(operation),
    context.test ? formatTestOutput(context.test) : '',
    context.todo ? formatTodoList(context.todo) : '',
  ]

  return sections.filter(Boolean).join('')
}

function formatOperation(operation: ToolOperation): string {
  if (isEditOperation(operation)) {
    return formatEditOperation(operation)
  }

  if (isMultiEditOperation(operation)) {
    return formatMultiEditOperation(operation)
  }

  if (isWriteOperation(operation)) {
    return formatWriteOperation(operation)
  }

  return ''
}

function formatEditOperation(operation: EditOperation): string {
  return [
    prompts.EDIT_INSTRUCTIONS,
    '\n## Changes to review\n',
    '\nThis section contains the changes that the agent wants to make\n',
    formatSection('File Path', operation.tool_input.file_path),
    formatSection('Old String', operation.tool_input.old_string),
    formatSection('New String', operation.tool_input.new_string),
  ].join('')
}

function formatMultiEditOperation(operation: MultiEditOperation): string {
  const editsFormatted = operation.tool_input.edits
    .map((edit, index) => formatEdit(edit, index + 1))
    .join('')

  return [
    prompts.MULTI_EDIT_INSTRUCTIONS,
    '\n## Changes to review\n',
    '\nThis section contains the changes that the agent wants to make\n',
    formatSection('File Path', operation.tool_input.file_path),
    '\n### Edits\n',
    editsFormatted,
  ].join('')
}

function formatWriteOperation(operation: WriteOperation): string {
  return [
    prompts.WRITE_INSTRUCTIONS,
    '\n## Changes to review\n',
    '\nThis section contains the changes that the agent wants to make\n',
    formatSection('File Path', operation.tool_input.file_path),
    formatSection('Content', operation.tool_input.content),
  ].join('')
}

function formatEdit(
  edit: { old_string: string; new_string: string },
  index: number
): string {
  const fenceMarker = '```'
  return [
    `\n#### Edit ${index}:\n`,
    `**Old String:**\n${fenceMarker}\n${edit.old_string}\n${fenceMarker}\n`,
    `**New String:**\n${fenceMarker}\n${edit.new_string}\n${fenceMarker}\n`,
  ].join('')
}

function formatTestOutput(testOutput: string): string {
  return formatSection('Last Test Output', testOutput)
}

function formatTodoList(todoJson: string): string {
  const todos: Todo[] = JSON.parse(todoJson)

  const todoItems = todos
    .map(
      (todo, index) =>
        `\n${index + 1}. [${todo.status}] ${todo.content} (${todo.priority})`
    )
    .join('')

  return `\n### Latest Todo State${todoItems}\n`
}

function formatSection(title: string, content: string): string {
  const fenceMarker = '```'
  return `\n### ${title}\n${fenceMarker}\n${content}\n${fenceMarker}\n`
}
