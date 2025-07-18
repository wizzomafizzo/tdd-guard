import { GuardManager } from '../guard/GuardManager'
import { ValidationResult } from '../contracts/types/ValidationResult'

export class UserPromptHandler {
  private readonly guardManager: GuardManager

  constructor(guardManager?: GuardManager) {
    this.guardManager = guardManager ?? new GuardManager()
  }

  async processUserCommand(hookData: string): Promise<void> {
    const data = JSON.parse(hookData)
    
    // Only process UserPromptSubmit events
    if (data.hook_event_name !== 'UserPromptSubmit') {
      return
    }
    
    const command = data.prompt?.toLowerCase()
    
    if (command === 'tdd-guard on') {
      await this.guardManager.enable()
    } else if (command === 'tdd-guard off') {
      await this.guardManager.disable()
    }
  }

  async getDisabledResult(): Promise<ValidationResult | undefined> {
    const isEnabled = await this.guardManager.isEnabled()
    if (!isEnabled) {
      return { decision: undefined, reason: '' }
    }
    return undefined
  }
}