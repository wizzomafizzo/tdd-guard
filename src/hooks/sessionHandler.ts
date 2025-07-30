import { Storage } from '../storage/Storage'
import { FileStorage } from '../storage/FileStorage'
import { SessionStartSchema } from '../contracts/schemas/toolSchemas'

export class SessionHandler {
  private readonly storage: Storage

  constructor(storage?: Storage) {
    this.storage = storage ?? new FileStorage()
  }

  async processSessionStart(hookData: string): Promise<void> {
    const parsedData = JSON.parse(hookData)
    const sessionStartResult = SessionStartSchema.safeParse(parsedData)
    
    if (!sessionStartResult.success) {
      return
    }

    await this.storage.clearTransientData()
  }
}