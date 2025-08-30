import { Storage } from '../storage/Storage'
import { FileStorage } from '../storage/FileStorage'
import { SessionStartSchema } from '../contracts/schemas/toolSchemas'
import { TDD_CORE_PRINCIPLES } from '../validation/prompts/tdd-core-principles'

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

    await this.ensureInstructionsExist()
    await this.storage.clearTransientData()
  }

  private async ensureInstructionsExist(): Promise<void> {
    const existingInstructions = await this.storage.getInstructions()
    if (!existingInstructions) {
      await this.storage.saveInstructions(TDD_CORE_PRINCIPLES)
    }
  }
}