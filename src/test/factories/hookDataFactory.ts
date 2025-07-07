/**
 * Test data factory for creating hook data objects used in tests.
 * Provides consistent test data structures for Write, Edit, and TodoWrite operations.
 */

export const hookDataFactory = {
  /**
   * Creates a Write hook data object
   * @param overrides - Optional overrides for default values
   */
  write: (overrides?: { filePath?: string; content?: string }) => ({
    tool_name: 'Write',
    tool_input: {
      file_path: overrides?.filePath ?? '/test/newfile.ts',
      content: overrides?.content ?? 'file content to write',
    },
  }),

  /**
   * Creates an Edit hook data object
   * @param overrides - Optional overrides for default values
   */
  edit: (overrides?: {
    filePath?: string
    oldString?: string
    newString?: string
  }) => ({
    tool_name: 'Edit',
    tool_input: {
      file_path: overrides?.filePath ?? '/test/file.ts',
      old_string: overrides?.oldString ?? 'old content;',
      new_string: overrides?.newString ?? 'old content; new content',
    },
  }),

  /**
   * Creates a TodoWrite hook data object
   * @param overrides - Optional overrides for default values
   */
  todoWrite: (overrides?: {
    todos?: Array<{
      content: string
      status?: string
      priority?: string
      id?: string
    }>
  }) => ({
    tool_name: 'TodoWrite',
    tool_input: {
      todos: overrides?.todos ?? [
        { content: 'Write tests', status: 'in_progress' },
        { content: 'Implement feature', status: 'pending' },
      ],
    },
  }),

  /**
   * Creates a MultiEdit hook data object
   * @param overrides - Optional overrides for default values
   */
  multiEdit: (overrides?: {
    filePath?: string
    edits?: Array<{
      old_string: string
      new_string: string
      replace_all?: boolean
    }>
  }) => ({
    tool_name: 'MultiEdit',
    tool_input: {
      file_path: overrides?.filePath ?? '/test/file.ts',
      edits: overrides?.edits ?? [
        {
          old_string: 'first old content',
          new_string: 'first new content',
          replace_all: false,
        },
        {
          old_string: 'second old content',
          new_string: 'second new content',
          replace_all: false,
        },
      ],
    },
  }),

  // Invalid data factories for testing error cases

  /**
   * Creates an Edit hook data with wrong fields (content instead of old_string/new_string)
   */
  editWithWrongFields: (overrides?: {
    filePath?: string
    content?: string
  }) => ({
    tool_name: 'Edit',
    tool_input: {
      file_path: overrides?.filePath ?? '/src/example.ts',
      content: overrides?.content ?? 'wrong field for edit', // should have old_string/new_string
    },
  }),

  /**
   * Creates a hook data object with an invalid tool name
   */
  invalidToolName: (overrides?: { toolName?: string; filePath?: string }) => ({
    tool_name: overrides?.toolName ?? 'InvalidTool',
    tool_input: {
      file_path: overrides?.filePath ?? '/src/example.ts',
    },
  }),

  /**
   * Creates incomplete content with missing required fields
   * This is just the tool_input content without the wrapper
   */
  incompleteEditContent: (overrides?: { filePath?: string }) => ({
    file_path: overrides?.filePath ?? '/src/example.ts',
    // missing required old_string and new_string fields
  }),

  /**
   * Creates incomplete Write content missing the content field
   */
  incompleteWriteContent: (overrides?: { filePath?: string }) => ({
    file_path: overrides?.filePath ?? '/src/example.ts',
    // missing required content field
  }),

  /**
   * Creates a Write hook data with wrong fields (old_string/new_string instead of content)
   */
  writeWithWrongFields: (overrides?: {
    filePath?: string
    oldString?: string
    newString?: string
  }) => ({
    tool_name: 'Write',
    tool_input: {
      file_path: overrides?.filePath ?? '/src/newfile.ts',
      old_string: overrides?.oldString ?? 'old content',
      new_string: overrides?.newString ?? 'new content', // should have content field
    },
  }),

  /**
   * Creates an empty hook data object (no tool_name or tool_input)
   */
  emptyEvent: () => ({}),

  /**
   * Creates a hook data object with empty tool_input
   */
  emptyToolInputEvent: () => ({
    tool_input: {},
  }),
}
