import { Context } from './Context'

export interface IModelClient {
  ask(question: string, context: Context): string
}
