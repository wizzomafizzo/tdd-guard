#!/usr/bin/env node

import { HookEvents } from '../HookEvents'
import { tddValidator } from '../tddValidator'
import path from 'path'

const logPath = process.env.HOOK_LOG_PATH || path.join(process.cwd(), 'logs')

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

    // Check if this is a PreToolUse hook for Edit tool
    if (hookData.hook_name === 'PreToolUse' && hookData.tool_name === 'Edit') {
      const context = {
        edit: hookData.tool_input?.new_string || '',
      }

      const result = tddValidator(context)

      if (result === 'violation') {
        console.log(
          JSON.stringify({
            decision: 'block',
            reason: 'TDD violation detected',
          })
        )
      }
    }
  } catch (error) {
    console.error('Failed to parse hook data:', error)
  } finally {
    process.exit(0)
  }
})
