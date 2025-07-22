import { Storage, FileStorage } from '@tdd-guard/storage'

export class GuardManager {
  private readonly storage: Storage

  constructor(storage?: Storage) {
    this.storage = storage ?? new FileStorage()
  }

  async isEnabled(): Promise<boolean> {
    const config = await this.storage.getConfig()
    if (!config) {
      return true
    }

    const parsedConfig = JSON.parse(config)
    return parsedConfig.guardEnabled ?? true
  }

  async enable(): Promise<void> {
    await this.storage.saveConfig(JSON.stringify({ guardEnabled: true }))
  }

  async disable(): Promise<void> {
    await this.storage.saveConfig(JSON.stringify({ guardEnabled: false }))
  }
}
