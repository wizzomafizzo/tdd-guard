import { ClaudeModelClient } from './models/ClaudeModelClient'
import { IModelClient } from '../contracts/types/ModelClient'
import { TDDValidationResult } from '../contracts/types/TDDValidation'
import { Context } from '../contracts/types/Context'
import { generateDynamicContext } from './context/context'

export async function tddValidator(
  context: Context,
  modelClient: IModelClient = new ClaudeModelClient()
): Promise<TDDValidationResult> {
  try {
    const prompt = generateDynamicContext(context)
    const response = await modelClient.ask(prompt)
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
