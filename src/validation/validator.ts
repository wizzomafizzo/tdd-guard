import { ClaudeCli } from './models/ClaudeCli'
import { IModelClient } from '../contracts/types/ModelClient'
import { ValidationResult } from '../contracts/types/ValidationResult'
import { Context } from '../contracts/types/Context'
import { generateDynamicContext } from './context/context'

interface ModelResponseJson {
  decision: 'block' | 'approve' | null
  reason: string
}

export async function validator(
  context: Context,
  modelClient: IModelClient = new ClaudeCli()
): Promise<ValidationResult> {
  try {
    const prompt = generateDynamicContext(context)
    const response = await modelClient.ask(prompt)
    return parseModelResponse(response)
  } catch {
    return {
      decision: undefined,
      reason: 'Error during validation',
    }
  }
}

function parseModelResponse(response: string): ValidationResult {
  const jsonString = extractJsonString(response)
  const parsed = JSON.parse(jsonString)
  return normalizeValidationResult(parsed)
}

function extractJsonString(response: string): string {
  const jsonFromCodeBlock = extractFromJsonCodeBlock(response)
  if (jsonFromCodeBlock) {
    return jsonFromCodeBlock
  }

  const jsonFromGenericBlock = extractFromGenericCodeBlock(response)
  if (jsonFromGenericBlock) {
    return jsonFromGenericBlock
  }

  return response
}

function extractFromJsonCodeBlock(response: string): string | null {
  const jsonMatches = Array.from(
    response.matchAll(/```json\s*\n?([\s\S]*?)\n?```/g)
  )

  if (jsonMatches.length > 0) {
    return jsonMatches[jsonMatches.length - 1][1].trim()
  }

  return null
}

function extractFromGenericCodeBlock(response: string): string | null {
  const genericMatch = response.match(/```\s*\n?([\s\S]*?)\n?```/)

  if (!genericMatch) {
    return null
  }

  const content = genericMatch[1].trim()

  if (isValidJson(content)) {
    return content
  }

  // Remove all fence blocks and return the remaining content
  return response.replace(/```[^`]*```/g, '').trim()
}

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

function normalizeValidationResult(
  parsed: ModelResponseJson
): ValidationResult {
  return {
    decision: parsed.decision === null ? undefined : parsed.decision,
    reason: parsed.reason,
  }
}
