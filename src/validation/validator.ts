import { ClaudeCli } from './models/ClaudeCli'
import { IModelClient } from '../contracts/types/ModelClient'
import { ValidationResult } from '../contracts/types/ValidationResult'
import { Context } from '../contracts/types/Context'
import { generateDynamicContext } from './context/context'

const VALIDATION_ERROR_SUFFIX =
  'Is tdd-guard configured correctly? Check your .env file and ensure Claude CLI is installed.'
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
  } catch (error) {
    return {
      decision: 'block',
      reason: `Error during validation: ${error instanceof Error ? error.message : 'Unknown error'}. ${VALIDATION_ERROR_SUFFIX}`,
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
  // Find all json code blocks
  const startPattern = '```json'
  const endPattern = '```'
  const blocks: string[] = []

  let startIndex = 0
  while (true) {
    const blockStart = response.indexOf(startPattern, startIndex)
    if (blockStart === -1) break

    const contentStart = blockStart + startPattern.length
    const blockEnd = response.indexOf(endPattern, contentStart)
    if (blockEnd === -1) break

    const content = response.substring(contentStart, blockEnd).trim()
    blocks.push(content)
    startIndex = blockEnd + endPattern.length
  }

  if (blocks.length > 0) {
    return blocks[blocks.length - 1]
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
  // Find first code block
  const startPattern = '```'
  const blockStart = response.indexOf(startPattern)
  if (blockStart === -1) return null

  const contentStart = blockStart + startPattern.length
  // Skip any whitespace/newline after opening ```
  let actualStart = contentStart
  while (actualStart < response.length && /\s/.test(response[actualStart])) {
    actualStart++
  }

  const blockEnd = response.indexOf(startPattern, actualStart)
  if (blockEnd === -1) return null

  const content = response.substring(actualStart, blockEnd).trim()

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
    decision: parsed.decision ?? undefined,
    reason: parsed.reason,
  }
}
