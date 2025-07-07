import { z } from 'zod'

// Schema for todos
export const TodoSchema = z.object({
  content: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  id: z.string().optional(),
})

// Tool-specific schemas
export const EditSchema = z.object({
  file_path: z.string(),
  old_string: z.string(),
  new_string: z.string(),
  replace_all: z.boolean().optional(),
})

export const WriteSchema = z.object({
  file_path: z.string(),
  content: z.string(),
})

export const TodoWriteSchema = z.object({
  todos: z.array(TodoSchema),
})

// Schema for individual edit in MultiEdit
export const EditEntrySchema = z.object({
  old_string: z.string(),
  new_string: z.string(),
  replace_all: z.boolean().optional(),
})

export const MultiEditSchema = z.object({
  file_path: z.string(),
  edits: z.array(EditEntrySchema),
})

// Discriminated union for tool operations
export const ToolOperationSchema = z.discriminatedUnion('tool_name', [
  z.object({
    tool_name: z.literal('Edit'),
    tool_input: EditSchema,
  }),
  z.object({
    tool_name: z.literal('Write'),
    tool_input: WriteSchema,
  }),
  z.object({
    tool_name: z.literal('TodoWrite'),
    tool_input: TodoWriteSchema,
  }),
  z.object({
    tool_name: z.literal('MultiEdit'),
    tool_input: MultiEditSchema,
  }),
])

// Union of modification types
export const ModificationSchema = z.union([
  EditSchema,
  WriteSchema,
  MultiEditSchema,
])

// Type guards
export const isEditOperation = (
  content: unknown
): content is z.infer<typeof EditSchema> => {
  return EditSchema.safeParse(content).success
}

// Helper for parsing stored content with proper error handling
export const parseStoredContent = (
  jsonString: string
): z.infer<typeof ModificationSchema> => {
  const parsed = JSON.parse(jsonString)
  const result = ModificationSchema.safeParse(parsed)

  if (!result.success) {
    throw new Error(`Invalid stored content: ${result.error.message}`)
  }

  return result.data
}

// Helper to create modification JSON from validated data
export const createModificationJson = (
  data:
    | z.infer<typeof EditSchema>
    | z.infer<typeof WriteSchema>
    | z.infer<typeof MultiEditSchema>
): string => {
  if ('edits' in data) {
    // It's a multi-edit operation - exclude replace_all from storage
    const { file_path, edits } = data
    const cleanedEdits = edits.map(({ old_string, new_string }) => ({
      old_string,
      new_string,
    }))
    return JSON.stringify({ file_path, edits: cleanedEdits })
  } else if ('new_string' in data) {
    // It's an edit operation - exclude replace_all from storage
    const { file_path, old_string, new_string } = data
    return JSON.stringify({ file_path, old_string, new_string })
  } else {
    // It's a write operation
    return JSON.stringify(data)
  }
}
