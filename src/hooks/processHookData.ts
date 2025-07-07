import { TDDValidationResult } from '../contracts/types/TDDValidation'
import { Storage } from '../storage/Storage'
import { Context } from '../contracts/types/Context'
import { buildContext } from '../cli/buildContext'
import { HookEvents } from './HookEvents'

export interface ProcessHookDataDeps {
  storage?: Storage
  tddValidator?: (context: Context) => TDDValidationResult
}

export async function processHookData(
  inputData: string,
  deps: ProcessHookDataDeps = {}
): Promise<TDDValidationResult> {
  const parsedData = JSON.parse(inputData)

  if (deps.storage) {
    const hookEvents = new HookEvents(deps.storage)
    await hookEvents.logHookData(parsedData)
  }

  if (deps.tddValidator && deps.storage) {
    const context = await buildContext(deps.storage)
    return deps.tddValidator(context)
  }

  return {
    decision: undefined,
    reason: '',
  }
}
