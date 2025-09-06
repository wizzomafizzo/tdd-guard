import { IModelClient } from '../contracts/types/ModelClient'
import { Config } from '../config/Config'
import { ClaudeCli } from '../validation/models/ClaudeCli'
import { AnthropicApi } from '../validation/models/AnthropicApi'
import { ClaudeCodeSdk } from '../validation/models/ClaudeCodeSdk'

export class ModelClientProvider {
  getModelClient(config?: Config): IModelClient {
    const actualConfig = config ?? new Config()

    switch (actualConfig.validationClient) {
      case 'sdk':
        return new ClaudeCodeSdk(actualConfig)
      case 'api':
        return new AnthropicApi(actualConfig)
      case 'cli':
        return new ClaudeCli(actualConfig)
      default:
        return new ClaudeCli(actualConfig)
    }
  }
}
