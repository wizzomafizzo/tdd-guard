import { Config } from '../../config/Config'

export function config(overrides: Partial<Config> = {}): Config {
  const dataDir = overrides.dataDir ?? '.claude/tdd-guard/data'
  return {
    dataDir,
    useLocalClaude: overrides.useLocalClaude ?? false,
    anthropicApiKey: overrides.anthropicApiKey,
    testReportPath: overrides.testReportPath ?? `${dataDir}/test.txt`,
  } as Config
}
