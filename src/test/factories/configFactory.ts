import { Config } from '../../config/Config'

export function config(overrides: Partial<Config> = {}): Config {
  const dataDir = overrides.dataDir ?? '.claude/tdd-guard/data'
  return {
    dataDir,
    useLocalClaude: overrides.useLocalClaude ?? false,
    testReportPath: overrides.testReportPath ?? `${dataDir}/test.txt`,
  } as Config
}
