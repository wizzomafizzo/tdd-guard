#!/usr/bin/env node

import { HookEvents } from '../HookEvents'
import path from 'path'

const logPath =
  process.env.HOOK_LOG_PATH ||
  path.join(process.cwd(), 'logs', 'content-events.log')

let inputData = ''
process.stdin.setEncoding('utf8')

process.stdin.on('data', (chunk) => {
  inputData += chunk
})

process.stdin.on('end', async () => {
  try {
    const hookData = JSON.parse(inputData)
    const hookEvents = new HookEvents(logPath)
    await hookEvents.logHookData(hookData)
  } catch (error) {
    console.error('Failed to parse hook data:', error)
  } finally {
    process.exit(0)
  }
})
