import { Storage } from './Storage'
import { Config } from '../config/Config'
import fs from 'fs/promises'
import path from 'path'

export class FileStorage implements Storage {
  private readonly files = {
    test: 'test.txt',
    todo: 'todo.json',
    modifications: 'modifications.json',
  } as const
  private readonly basePath: string

  constructor(config?: Config) {
    config ??= new Config()
    this.basePath = config.dataDir
  }

  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true })
  }

  private async save(
    type: keyof typeof this.files,
    content: string
  ): Promise<void> {
    await this.ensureDirectory()
    await fs.writeFile(path.join(this.basePath, this.files[type]), content)
  }

  private async get(type: keyof typeof this.files): Promise<string | null> {
    try {
      return await fs.readFile(
        path.join(this.basePath, this.files[type]),
        'utf-8'
      )
    } catch {
      return null
    }
  }

  async saveTest(content: string): Promise<void> {
    await this.save('test', content)
  }

  async saveTodo(content: string): Promise<void> {
    await this.save('todo', content)
  }

  async saveModifications(content: string): Promise<void> {
    await this.save('modifications', content)
  }

  async getTest(): Promise<string | null> {
    return this.get('test')
  }

  async getTodo(): Promise<string | null> {
    return this.get('todo')
  }

  async getModifications(): Promise<string | null> {
    return this.get('modifications')
  }
}
