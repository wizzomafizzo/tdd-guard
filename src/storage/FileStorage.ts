import { Storage } from './Storage'
import fs from 'fs/promises'
import path from 'path'

export class FileStorage implements Storage {
  constructor(private basePath: string) {}

  private async ensureDirectory(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true })
  }

  async saveTest(content: string): Promise<void> {
    await this.ensureDirectory()
    await fs.writeFile(path.join(this.basePath, 'test.txt'), content)
  }

  async saveTodo(content: string): Promise<void> {
    await this.ensureDirectory()
    await fs.writeFile(path.join(this.basePath, 'todo.txt'), content)
  }

  async saveEdit(content: string): Promise<void> {
    await this.ensureDirectory()
    await fs.writeFile(path.join(this.basePath, 'edit.json'), content)
  }

  async getTest(): Promise<string | null> {
    try {
      return await fs.readFile(path.join(this.basePath, 'test.txt'), 'utf-8')
    } catch {
      return null
    }
  }

  async getTodo(): Promise<string | null> {
    try {
      return await fs.readFile(path.join(this.basePath, 'todo.txt'), 'utf-8')
    } catch {
      return null
    }
  }

  async getEdit(): Promise<string | null> {
    try {
      return await fs.readFile(path.join(this.basePath, 'edit.json'), 'utf-8')
    } catch {
      return null
    }
  }
}
