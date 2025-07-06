#!/usr/bin/env node

import path from 'path'
import { FileStorage } from '../storage/FileStorage'

let inputData = ''
process.stdin.setEncoding('utf8')

process.stdin.on('data', (chunk) => {
  inputData += chunk
})

process.stdin.on('end', async () => {
  const logsDir = path.join(process.cwd(), 'logs')
  const storage = new FileStorage(logsDir)

  await storage.saveTest(inputData)

  // Echo to stdout
  process.stdout.write(inputData)
})
