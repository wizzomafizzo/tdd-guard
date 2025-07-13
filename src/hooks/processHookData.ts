import { ValidationResult } from '../contracts/types/ValidationResult'
import { Storage } from '../storage/Storage'
import { Context } from '../contracts/types/Context'
import { buildContext } from '../cli/buildContext'
import { HookEvents } from './HookEvents'
import { HookDataSchema, HookData, isTodoWriteOperation, ToolOperationSchema } from '../contracts/schemas/toolSchemas'

export interface ProcessHookDataDeps {
  storage?: Storage
  validator?: (context: Context) => Promise<ValidationResult>
}

export const defaultResult: ValidationResult = {
  decision: undefined,
  reason: '',
}

export async function processHookData(
  inputData: string,
  deps: ProcessHookDataDeps = {}
): Promise<ValidationResult> {
  const parsedData = JSON.parse(inputData)
  
  const hookResult = HookDataSchema.safeParse(parsedData)
  if (!hookResult.success) {
    return defaultResult
  }

  await processHookEvent(parsedData, deps.storage)

  if (shouldSkipValidation(hookResult.data)) {
    return defaultResult
  }

  return await performValidation(deps)
}

async function processHookEvent(parsedData: unknown, storage?: Storage): Promise<void> {
  if (storage) {
    const hookEvents = new HookEvents(storage)
    await hookEvents.processEvent(parsedData)
  }
}

function shouldSkipValidation(hookData: HookData): boolean {
  const operationResult = ToolOperationSchema.safeParse({
    ...hookData,
    tool_input: hookData.tool_input,
  })

  return !operationResult.success || isTodoWriteOperation(operationResult.data)
}

async function performValidation(deps: ProcessHookDataDeps): Promise<ValidationResult> {
  if (deps.validator && deps.storage) {
    const context = await buildContext(deps.storage)
    return await deps.validator(context)
  }
  
  return defaultResult
}
