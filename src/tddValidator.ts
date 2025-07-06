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

    // The model should return either 'violation' or 'ok'
    if (!response) return 'ok'
    return response.trim().toLowerCase() === 'violation' ? 'violation' : 'ok'
  } catch {
    return 'ok'
  }
}
