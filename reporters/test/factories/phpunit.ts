import { spawnSync } from 'node:child_process'
import { mkdirSync, copyFileSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import type { ReporterConfig } from '../types'

export function createPhpunitReporter(): ReporterConfig {
  return {
    name: 'PHPUnitReporter',
    reporterPath: '../phpunit/src/TddGuardExtension.php',
    configFileName: 'phpunit.xml',
    artifactDir: 'phpunit',
    testScenarios: {
      singlePassing: 'SinglePassingTest.php',
      singleFailing: 'SingleFailingTest.php',
      singleImportError: 'SingleImportErrorTest.php',
    },
    createConfig: (tempDir) => `<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
         stopOnFailure="false">
    <testsuites>
        <testsuite name="Integration Tests">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    
    <extensions>
        <bootstrap class="TddGuard\\PHPUnit\\TddGuardExtension">
            <parameter name="projectRoot" value="${tempDir}"/>
        </bootstrap>
    </extensions>
</phpunit>
`,
    runCommand: (tempDir, configPath, artifactPath) => {
      // Create tests directory
      const testsDir = join(tempDir, 'tests')
      mkdirSync(testsDir, { recursive: true })

      // Copy test file to tests directory
      copyFileSync(join(tempDir, artifactPath), join(testsDir, artifactPath))

      // Create symlink to vendor directory
      const reporterVendorPath = join(__dirname, '../../phpunit/vendor')
      const tempVendorPath = join(tempDir, 'vendor')
      symlinkSync(reporterVendorPath, tempVendorPath)

      // Run PHPUnit
      const phpunitPath = join(__dirname, '../../phpunit/vendor/bin/phpunit')
      spawnSync(phpunitPath, ['-c', configPath], {
        cwd: tempDir,
        env: { ...process.env },
        stdio: 'pipe',
      })
    },
  }
}
