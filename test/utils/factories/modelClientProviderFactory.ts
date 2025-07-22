import { ModelClientProvider } from '../../../src/providers/ModelClientProvider'
import { IModelClient } from '@tdd-guard/contracts'
import { Config } from '@tdd-guard/config'

export function modelClientProvider(): ModelClientProvider {
  return new MockModelClientProvider()
}

class MockModelClientProvider extends ModelClientProvider {
  getModelClient(config?: Config): IModelClient {
    const actualConfig = config ?? new Config()

    return {
      ask: async () =>
        JSON.stringify({
          decision: undefined,
          reason: `Using mock model client with modelType: ${actualConfig.modelType}`,
        }),
    }
  }
}
