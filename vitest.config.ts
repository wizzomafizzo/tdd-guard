import { defineConfig } from 'vitest/config'
import { VitestReporter } from './src/reporters/VitestReporter'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 120000,
    reporters: ['default', new VitestReporter()],
  },
})
