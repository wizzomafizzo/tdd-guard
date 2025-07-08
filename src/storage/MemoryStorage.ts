import { Storage } from './Storage'

export class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  async saveTest(content: string): Promise<void> {
    this.store.set('test', content)
  }

  async saveTodo(content: string): Promise<void> {
    this.store.set('todo', content)
  }

  async saveModifications(content: string): Promise<void> {
    this.store.set('modifications', content)
  }

  async getTest(): Promise<string | null> {
    return this.store.get('test') ?? null
  }

  async getTodo(): Promise<string | null> {
    return this.store.get('todo') ?? null
  }

  async getModifications(): Promise<string | null> {
    return this.store.get('modifications') ?? null
  }
}
