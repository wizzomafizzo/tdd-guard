import { IModelClient } from '@tdd-guard/contracts'
import { Config } from '@tdd-guard/config'
import { ClaudeCli } from '../validation/models/ClaudeCli'
import { AnthropicApi } from '../validation/models/AnthropicApi'

export class ModelClientProvider {
  getModelClient(config?: Config): IModelClient {
    const actualConfig = config ?? new Config()

    if (actualConfig.modelType === 'anthropic_api') {
      return new AnthropicApi()
    }
    return new ClaudeCli()
  }
}
