import { ClaudeModelClient } from './ClaudeModelClient'
import { IModelClient } from './types/ModelClient'
import { TDDValidationResult } from './types/TDDValidation'
import { Context } from './types/Context'
import { SYSTEM_PROMPT } from './system-prompt'

export function tddValidator(
  context: Context,
  modelClient: IModelClient = new ClaudeModelClient()
): TDDValidationResult {
  try {
    const response = modelClient.ask(SYSTEM_PROMPT, context)
    const parsed = JSON.parse(response)

    // Convert null to undefined for consistency with the type
    return {
      decision: parsed.decision === null ? undefined : parsed.decision,
      reason: parsed.reason,
    }
  } catch {
    return {
      decision: undefined,
      reason: 'Error during validation',
    }
  }
}
