import { IModelClient } from '../contracts/types/ModelClient'
import { ClaudeCli } from '../validation/models/ClaudeCli'
import { AnthropicApi } from '../validation/models/AnthropicApi'

export class Config {
  readonly dataDir: string
  readonly useLocalClaude: boolean
  readonly anthropicApiKey: string | undefined
  readonly modelType: string

  constructor() {
    this.dataDir = '.claude/tdd-guard/data'
    this.useLocalClaude = process.env.USE_LOCAL_CLAUDE === 'true'
    this.anthropicApiKey = process.env.TDD_GUARD_ANTHROPIC_API_KEY
    this.modelType = process.env.MODEL_TYPE || 'claude_cli'
  }

  get testReportPath(): string {
    return `${this.dataDir}/test.txt`
  }

  getModelClient(isTestMode = false): IModelClient {
    const modelType =
      isTestMode && process.env.TEST_MODEL_TYPE
        ? process.env.TEST_MODEL_TYPE
        : this.modelType

    if (modelType === 'anthropic_api') {
      return new AnthropicApi()
    }
    return new ClaudeCli()
  }
}
