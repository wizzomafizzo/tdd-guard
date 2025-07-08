/**
 * Factory functions for creating Todo, TodoWrite, and TodoWriteOperation test data
 */

import type {
  Todo,
  TodoWrite,
  TodoWriteOperation,
} from '../../contracts/schemas/toolSchemas'
import { hookDataDefaults, omit } from './helpers'
import { TEST_DEFAULTS } from './testDefaults'

/**
 * Creates a single todo object
 * @param params - Optional parameters for the todo
 */
export const todo = (params?: Partial<Todo>): Todo => ({
  content: params?.content ?? TEST_DEFAULTS.todo.content,
  status: params?.status ?? TEST_DEFAULTS.todo.status,
  priority: params?.priority ?? TEST_DEFAULTS.todo.priority,
  id: params?.id ?? TEST_DEFAULTS.todo.id,
})

/**
 * Creates a todo object with specified properties omitted
 * @param keys - Array of property keys to omit
 * @param params - Optional parameters for the todo
 */
export const todoWithout = <K extends keyof Todo>(
  keys: K[],
  params?: Partial<Todo>
): Omit<Todo, K> => {
  const fullTodo = todo(params)
  return omit(fullTodo, keys)
}

/**
 * Creates a single todo write object
 * @param params - Optional parameters for the todo write
 */
export const todoWrite = (params?: { todos?: Todo[] }) => ({
  todos: params?.todos ?? [todo()],
})

/**
 * Creates a todo write object with specified properties omitted
 * @param keys - Array of property keys to omit
 * @param params - Optional parameters for the todo write
 */
export const todoWriteWithout = <K extends keyof TodoWrite>(
  keys: K[],
  params?: { todos?: Todo[] }
): Omit<TodoWrite, K> => {
  const fullTodoWrite = todoWrite(params)
  return omit(fullTodoWrite, keys)
}

/**
 * Creates a single todo write operation object
 * @param params - Optional parameters for the todo write operation
 */
export const todoWriteOperation = (
  params?: Partial<TodoWriteOperation>
): TodoWriteOperation => ({
  ...hookDataDefaults(),
  tool_name: 'TodoWrite',
  tool_input: params?.tool_input ?? todoWrite(),
})

/**
 * Creates a todo write operation object with specified properties omitted
 * @param keys - Array of property keys to omit
 * @param params - Optional parameters for the todo write operation
 */
export const todoWriteOperationWithout = <K extends keyof TodoWriteOperation>(
  keys: K[],
  params?: Partial<TodoWriteOperation>
): Omit<TodoWriteOperation, K> => {
  const fullTodoWriteOperation = todoWriteOperation(params)
  return omit(fullTodoWriteOperation, keys)
}

/**
 * Creates an invalid todo write operation object for testing
 * @param params - Parameters including invalid values
 */
export const invalidTodoWriteOperation = (params: {
  tool_name?: string
  tool_input?: unknown
}) => ({
  ...hookDataDefaults(),
  tool_name: params.tool_name ?? 'TodoWrite',
  tool_input: params.tool_input ?? todoWrite(),
})
