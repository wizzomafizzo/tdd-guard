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
  // Handle undefined/null responses
  if (!response) {
    throw new Error('No response from model')
  }

  const jsonFromCodeBlock = extractFromJsonCodeBlock(response)
  if (jsonFromCodeBlock) {
    return jsonFromCodeBlock
  }

  const jsonFromGenericBlock = extractFromGenericCodeBlock(response)
  if (jsonFromGenericBlock) {
    return jsonFromGenericBlock
  }

  // Try to extract plain JSON from text
  const plainJson = extractPlainJson(response)
  if (plainJson) {
    return plainJson
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

function extractPlainJson(response: string): string | null {
  // Simple regex to find JSON objects containing both "decision" and "reason" (in any order)
  const pattern =
    /\{[^{}]*"decision"[^{}]*"reason"[^{}]*}|\{[^{}]*"reason"[^{}]*"decision"[^{}]*}/g
  const matches = response.match(pattern)

  if (!matches) return null

  // Return the last match (most likely the final decision)
  const lastMatch = matches[matches.length - 1]

  // Validate it's proper JSON
  if (isValidJson(lastMatch)) {
    return lastMatch
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

  // Don't return content from non-JSON code blocks
  return null
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
