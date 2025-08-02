import { spawnSync } from 'node:child_process'
import type { ReporterConfig } from '../types'

export function createVitestReporter(): ReporterConfig {
  return {
    name: 'VitestReporter',
    reporterPath: '../vitest/dist/index.js',
    configFileName: 'vitest.config.js',
    artifactDir: 'vitest',
    testScenarios: {
      singlePassing: 'single-passing.test.js',
      singleFailing: 'single-failing.test.js',
      singleImportError: 'single-import-error.test.js',
    },
    createConfig: (tempDir, reporterPath) => `
export default {
  test: {
    reporters: [
      'default',
      ['${reporterPath}', '${tempDir}']
    ]
  }
};
`,
    runCommand: (tempDir) => {
      const vitestPath = require.resolve('vitest/vitest.mjs')
      spawnSync(process.execPath, [vitestPath, 'run', '--no-coverage'], {
        cwd: tempDir,
        env: { ...process.env, CI: 'true' },
        stdio: 'pipe',
      })
    },
  }
}
