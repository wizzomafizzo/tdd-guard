import { defineConfig } from 'vitest/config'
import { VitestReporter } from './src/reporters/VitestReporter'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 120000,
    reporters: ['default', new VitestReporter()],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/test/integration/validator.scenarios.test.ts', // Extensive test suite - run separately for faster feedback
    ],
  },
  resolve: {
    alias: {
      '@testUtils': path.resolve(__dirname, './test/utils/index.ts'),
    },
  },
})
