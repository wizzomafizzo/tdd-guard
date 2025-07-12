/**
 * Factory functions for creating Edit and EditOperation test data
 */

import type {
  Edit,
  EditOperation,
} from '../../../src/contracts/schemas/toolSchemas'
import { hookDataDefaults, omit } from './helpers'
import { TEST_DEFAULTS } from './testDefaults'

/**
 * Creates a single edit object
 * @param params - Optional parameters for the edit
 */
export const edit = (params?: Partial<Edit>): Edit => ({
  file_path: params?.file_path ?? TEST_DEFAULTS.edit.file_path,
  old_string: params?.old_string ?? TEST_DEFAULTS.edit.old_string,
  new_string: params?.new_string ?? TEST_DEFAULTS.edit.new_string,
  ...(params?.replace_all !== undefined && {
    replace_all: params.replace_all,
  }),
})

/**
 * Creates an edit object with specified properties omitted
 * @param keys - Array of property keys to omit
 * @param params - Optional parameters for the edit
 */
export const editWithout = <K extends keyof Edit>(
  keys: K[],
  params?: Partial<Edit>
): Omit<Edit, K> => {
  const fullEdit = edit(params)
  return omit(fullEdit, keys)
}

/**
 * Creates a single edit operation object
 * @param params - Optional parameters for the edit operation
 */
export const editOperation = (
  params?: Partial<EditOperation>
): EditOperation => ({
  ...hookDataDefaults(),
  tool_name: 'Edit',
  tool_input: params?.tool_input ?? edit(),
})

/**
 * Creates an edit operation object with specified properties omitted
 * @param keys - Array of property keys to omit
 * @param params - Optional parameters for the edit operation
 */
export const editOperationWithout = <K extends keyof EditOperation>(
  keys: K[],
  params?: Partial<EditOperation>
): Omit<EditOperation, K> => {
  const fullEditOperation = editOperation(params)
  return omit(fullEditOperation, keys)
}

/**
 * Creates an invalid edit operation object for testing
 * @param params - Parameters including invalid values
 */
export const invalidEditOperation = (params: {
  tool_name?: string
  tool_input?: unknown
}) => ({
  ...hookDataDefaults(),
  tool_name: params.tool_name ?? 'Edit',
  tool_input: params.tool_input ?? edit(),
})
