import { defineConfig } from 'vitest/config'
import { FileReporter } from './src/reporters/FileReporter'
import { Config } from './src/config/Config'
import 'dotenv/config'

const config = new Config()

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 120000,
    reporters: ['default', new FileReporter(config.testReportPath)],
  },
})
