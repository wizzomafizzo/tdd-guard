import { Storage } from '../storage/Storage'
import { Context } from '../contracts/types/Context'

export async function buildContext(storage: Storage): Promise<Context> {
  const edit = (await storage.getEdit()) || ''
  const test = (await storage.getTest()) || ''
  const todo = (await storage.getTodo()) || ''

  return {
    edit,
    test,
    todo,
  }
}
