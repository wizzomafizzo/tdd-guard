#!/usr/bin/env node

import 'dotenv/config'
import { processHookData } from '../hooks/processHookData'
import { FileStorage } from '../storage/FileStorage'
import { validator } from '../validation/validator'
import { Config } from '../config/Config'

export async function run(input: string, config?: Config) {
  const appConfig = config || new Config()
  const storage = new FileStorage(appConfig.dataDir)

  return processHookData(input, {
    storage,
    validator: validator,
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
