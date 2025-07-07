import { z } from 'zod'

// Schema for todos in TodoWrite tool
const TodoSchema = z.object({
  content: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  id: z.string().optional(),
})

// Schema for tool_input variations
const ToolInputSchema = z.object({
  new_string: z.string().optional(),
  old_string: z.string().optional(),
  file_path: z.string().optional(),
  content: z.string().optional(),
  todos: z.array(TodoSchema).optional(),
})

// Simple hook data schema (backward compatibility)
export const SimpleHookDataSchema = z.object({
  tool_name: z.string().optional(),
  tool_input: ToolInputSchema.optional(),
})

// Full hook event schema (from actual logs)
export const FullHookEventSchema = z.object({
  timestamp: z.string(),
  tool: z.string(),
  data: z.object({
    session_id: z.string(),
    transcript_path: z.string(),
    hook_event_name: z.string(),
    tool_name: z.string(),
    tool_input: ToolInputSchema.optional(),
  }),
})

// Union type that accepts either format
export const HookDataSchema = z.union([
  FullHookEventSchema,
  SimpleHookDataSchema,
])

export type HookData = z.infer<typeof HookDataSchema>
export type ToolInput = z.infer<typeof ToolInputSchema>
