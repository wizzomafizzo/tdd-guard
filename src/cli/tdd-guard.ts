#!/usr/bin/env node

import { processHookData } from '../hooks/processHookData'
import { FileStorage } from '../storage/FileStorage'
import { tddValidator } from '../validation/tddValidator'
import path from 'path'

let inputData = ''
process.stdin.setEncoding('utf8')

process.stdin.on('data', (chunk) => {
  inputData += chunk
})

process.stdin.on('end', async () => {
  try {
    const logPath =
      process.env.HOOK_LOG_PATH || path.join(process.cwd(), 'logs')
    const storage = new FileStorage(logPath)

    const result = await processHookData(inputData, {
      storage,
      tddValidator,
    })
    console.log(JSON.stringify(result))
  } catch (error) {
    console.error('Failed to parse hook data:', error)
  } finally {
    process.exit(0)
  }
})
