import { defineConfig } from 'vitest/config'
import { FileReporter } from './src/reporters/FileReporter'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 20000,
    reporters: ['default', new FileReporter('logs/test.txt')],
  },
})
