import { TDDValidationResult } from '../contracts/types/TDDValidation'
import { Storage } from '../storage/Storage'
import { Context } from '../contracts/types/Context'
import { buildContext } from '../cli/buildContext'
import { HookEvents } from './HookEvents'
import { HookDataSchema, isTodoWriteOperation, ToolOperationSchema } from '../contracts/schemas/toolSchemas'

export interface ProcessHookDataDeps {
  storage?: Storage
  tddValidator?: (context: Context) => Promise<TDDValidationResult>
}

export const defaultResult: TDDValidationResult = {
  decision: undefined,
  reason: '',
}

export async function processHookData(
  inputData: string,
  deps: ProcessHookDataDeps = {}
): Promise<TDDValidationResult> {
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

  if (deps.tddValidator && deps.storage) {
    const context = await buildContext(deps.storage)
    return await deps.tddValidator(context)
  }

  return defaultResult
}
