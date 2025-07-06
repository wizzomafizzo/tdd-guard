#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'

let inputData = ''
process.stdin.setEncoding('utf8')

process.stdin.on('data', (chunk) => {
  inputData += chunk
})

process.stdin.on('end', async () => {
  const logsDir = path.join(process.cwd(), 'logs')
  const logPath = path.join(logsDir, 'test.txt')

  await fs.mkdir(logsDir, { recursive: true })
  await fs.writeFile(logPath, inputData)

  // Echo to stdout
  process.stdout.write(inputData)
})
