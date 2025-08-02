import { spawnSync } from 'node:child_process'
import type { ReporterConfig } from '../types'

export function createJestReporter(): ReporterConfig {
  return {
    name: 'JestReporter',
    reporterPath: '../jest/dist/index.js',
    configFileName: 'jest.config.js',
    artifactDir: 'jest',
    testScenarios: {
      singlePassing: 'single-passing.test.js',
      singleFailing: 'single-failing.test.js',
      singleImportError: 'single-import-error.test.js',
    },
    createConfig: (tempDir, reporterPath) => `
const path = require('path');

module.exports = {
  testMatch: ['**/*.test.js'],
  reporters: [
    'default',
    ['${reporterPath}', {
      projectRoot: '${tempDir}'
    }]
  ]
};
`,
    runCommand: (tempDir) => {
      const jestCliPath = require.resolve('jest-cli/bin/jest')
      spawnSync(process.execPath, [jestCliPath, '--no-cache'], {
        cwd: tempDir,
        env: { ...process.env, CI: 'true' },
        stdio: 'pipe',
      })
    },
  }
}
