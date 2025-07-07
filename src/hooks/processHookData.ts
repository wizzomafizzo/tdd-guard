import { TDDValidationResult } from '../contracts/types/TDDValidation'
import { Storage } from '../storage/Storage'
import { Context } from '../contracts/types/Context'
import { buildContext } from '../cli/buildContext'
import { HookEvents } from './HookEvents'
import { HookDataSchema } from '../contracts/schemas/hookData'

export interface ProcessHookDataDeps {
  storage?: Storage
  tddValidator?: (context: Context) => TDDValidationResult
}

export const defaultResult: TDDValidationResult = {
  decision: undefined,
  reason: '',
}

function shouldSkipValidation(toolName?: string): boolean {
  return toolName === 'TodoWrite'
}

export async function processHookData(
  inputData: string,
  deps: ProcessHookDataDeps = {}
): Promise<TDDValidationResult> {
  const parsedData = JSON.parse(inputData)
  
  // Validate and parse the hook data
  const parseResult = HookDataSchema.safeParse(parsedData)
  if (!parseResult.success) {
    return defaultResult
  }

  const hookData = parseResult.data
  const toolName = 'data' in hookData ? hookData.data.tool_name : hookData.tool_name

  // Log the hook data to storage
  if (deps.storage) {
    const hookEvents = new HookEvents(deps.storage)
    await hookEvents.logHookData(parsedData)
  }

  // Check if validation should be skipped
  if (shouldSkipValidation(toolName)) {
    return defaultResult
  }

  // Run TDD validation if applicable
  if (deps.tddValidator && deps.storage) {
    const context = await buildContext(deps.storage)
    return deps.tddValidator(context)
  }

  return defaultResult
}
