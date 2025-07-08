import { Storage } from '../storage/Storage'
import { Context } from '../contracts/types/Context'

export async function buildContext(storage: Storage): Promise<Context> {
  let modifications = (await storage.getModifications()) || ''
  const test = (await storage.getTest()) || ''
  const todo = (await storage.getTodo()) || ''

  // Pretty-print JSON modifications data for better readability
  if (modifications) {
    try {
      const parsed = JSON.parse(modifications)
      modifications = JSON.stringify(parsed, null, 2)
    } catch {
      // If it's not valid JSON, leave it as is
    }
  }

  return {
    modifications,
    test,
    todo,
  }
}
