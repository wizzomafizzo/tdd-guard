import { Storage } from '../storage/Storage'
import { Context } from '../contracts/types/Context'

export async function buildContext(storage: Storage): Promise<Context> {
  let edit = (await storage.getEdit()) || ''
  const test = (await storage.getTest()) || ''
  const todo = (await storage.getTodo()) || ''

  // Pretty-print JSON edit data for better readability
  if (edit) {
    try {
      const parsed = JSON.parse(edit)
      edit = JSON.stringify(parsed, null, 2)
    } catch {
      // If it's not valid JSON, leave it as is
    }
  }

  return {
    edit,
    test,
    todo,
  }
}
