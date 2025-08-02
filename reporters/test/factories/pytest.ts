import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import type { ReporterConfig } from '../types'

export function createPytestReporter(): ReporterConfig {
  return {
    name: 'PytestReporter',
    reporterPath: '../pytest/tdd_guard_pytest',
    configFileName: 'pytest.ini',
    artifactDir: 'pytest',
    testScenarios: {
      singlePassing: 'test_single_passing.py',
      singleFailing: 'test_single_failing.py',
      singleImportError: 'test_single_import_error.py',
    },
    createConfig: (tempDir) => `[pytest]
tdd_guard_project_root = ${tempDir}
`,
    runCommand: (tempDir, configPath, artifactPath) => {
      // Use pytest from the existing venv
      const pytestPath = join(__dirname, '../../pytest/.venv/bin/pytest')

      // Run pytest using the venv's pytest
      spawnSync(pytestPath, [artifactPath, '-c', configPath], {
        cwd: tempDir,
        stdio: 'pipe',
        encoding: 'utf8',
      })
    },
  }
}
