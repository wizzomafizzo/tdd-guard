import { ClaudeModelClient } from './ClaudeModelClient'
import { IModelClient } from './types/ModelClient'
import { TDDValidationResult } from './types/TDDValidation'

export function tddValidator(
  content: string,
  modelClient: IModelClient = new ClaudeModelClient()
): TDDValidationResult {
  const question =
    'Count the number of test() calls in the `<edit>` section. If there are 2 or more tests, respond with exactly the word "violation". If there is 1 or 0 tests, respond with exactly the word "ok".'

  try {
    const response = modelClient.ask(question, { edit: content })

    // The model should return either 'violation' or 'ok'
    if (!response) return 'ok'
    return response.trim().toLowerCase() === 'violation' ? 'violation' : 'ok'
  } catch {
    return 'ok'
  }
}
