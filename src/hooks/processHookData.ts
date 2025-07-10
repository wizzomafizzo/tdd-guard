import { ValidationResult } from '../contracts/types/ValidationResult'
import { Storage } from '../storage/Storage'
import { Context } from '../contracts/types/Context'
import { buildContext } from '../cli/buildContext'
import { HookEvents } from './HookEvents'
import { HookDataSchema, isTodoWriteOperation, ToolOperationSchema } from '../contracts/schemas/toolSchemas'

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

  if (deps.storage) {
    const hookEvents = new HookEvents(deps.storage)
    await hookEvents.processEvent(parsedData)
  }

  const operationResult = ToolOperationSchema.safeParse({
    ...hookResult.data,
    tool_input: hookResult.data.tool_input,
  })

  if (!operationResult.success || isTodoWriteOperation(operationResult.data)) {
    return defaultResult
  }

  if (deps.validator && deps.storage) {
    const context = await buildContext(deps.storage)
    return await deps.validator(context)
  }

  return defaultResult
}
