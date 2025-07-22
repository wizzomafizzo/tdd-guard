#!/usr/bin/env node

import 'dotenv/config'
import { processHookData } from '../hooks/processHookData'
import { FileStorage } from '../storage/FileStorage'
import { Storage } from '../storage/Storage'
import { validator } from '../validation/validator'
import { Config } from '@tdd-guard/config'
import { ModelClientProvider } from '../providers/ModelClientProvider'
import { ValidationResult } from '@tdd-guard/contracts'

export async function run(
  input: string,
  config?: Config,
  storage?: Storage,
  provider?: ModelClientProvider
): Promise<ValidationResult> {
  const appConfig = config ?? new Config()
  const actualStorage = storage ?? new FileStorage(appConfig)
  const modelProvider = provider ?? new ModelClientProvider()
  const modelClient = modelProvider.getModelClient(appConfig)

  return processHookData(input, {
    storage: actualStorage,
    validator: (context) => validator(context, modelClient),
  })
}

// Only run if this is the main module
if (require.main === module) {
  let inputData = ''
  process.stdin.setEncoding('utf8')

  process.stdin.on('data', (chunk) => {
    inputData += chunk
  })

  process.stdin.on('end', async () => {
    try {
      const result = await run(inputData)
      console.log(JSON.stringify(result))
    } catch (error) {
      console.error('Failed to parse hook data:', error)
    } finally {
      process.exit(0)
    }
  })
}
