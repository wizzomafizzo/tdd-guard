import { Storage } from '../storage/Storage'
import { LintDataSchema } from '../contracts/schemas/lintSchemas'
import { Context } from '../contracts/types/Context'
import { processLintData } from '../processors/lintProcessor'

export async function buildContext(storage: Storage): Promise<Context> {
  const [modifications, rawTest, todo, lint] = await Promise.all([
    storage.getModifications(),
    storage.getTest(),
    storage.getTodo(),
    storage.getLint(),
  ])

  let processedLintData
  try {
    if (lint) {
      const rawLintData = LintDataSchema.parse(JSON.parse(lint))
      processedLintData = processLintData(rawLintData)
    } else {
      processedLintData = processLintData()
    }
  } catch {
    processedLintData = processLintData()
  }

  return {
    modifications: formatModifications(modifications ?? ''),
    test: rawTest ?? '',
    todo: todo ?? '',
    lint: processedLintData,
  }
}

function formatModifications(modifications: string): string {
  if (!modifications) {
    return ''
  }

  try {
    const parsed = JSON.parse(modifications)
    return JSON.stringify(parsed, null, 2)
  } catch {
    // If it's not valid JSON, leave it as is
    return modifications
  }
}
