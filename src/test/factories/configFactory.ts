import { Config } from '../../config/Config'

export function config(overrides: Partial<Config> = {}): Config {
  return {
    dataDir: overrides.dataDir || '/test/data',
    claudeBinaryPath: overrides.claudeBinaryPath || 'claude',
    testReportPath: overrides.testReportPath || '/test/data/test.txt',
    fileStoragePath: overrides.fileStoragePath || '/test/data/storage',
    ...overrides,
  } as Config
}
