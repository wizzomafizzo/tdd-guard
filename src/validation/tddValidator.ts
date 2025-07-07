import { ClaudeModelClient } from './models/ClaudeModelClient'
import { IModelClient } from '../contracts/types/ModelClient'
import { TDDValidationResult } from '../contracts/types/TDDValidation'
import { Context } from '../contracts/types/Context'
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
