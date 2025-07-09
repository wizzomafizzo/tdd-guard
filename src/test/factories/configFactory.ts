import { Config } from '../../config/Config'

export function config(overrides: Partial<Config> = {}): Config {
  return {
    dataDir: overrides.dataDir ?? '/test/data',
    useLocalClaude: overrides.useLocalClaude ?? false,
    testReportPath: overrides.testReportPath ?? '/test/data/test.txt',
    fileStoragePath: overrides.fileStoragePath ?? '/test/data/storage',
  } as Config
}
