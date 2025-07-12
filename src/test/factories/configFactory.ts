import { Config } from '../../config/Config'

export function config(overrides: Partial<Config> = {}): Config {
  const dataDir = overrides.dataDir ?? '.claude/tdd-guard/data'
  return {
    dataDir,
    useSystemClaude: overrides.useSystemClaude ?? false,
    anthropicApiKey: overrides.anthropicApiKey,
    testReportPath: overrides.testReportPath ?? `${dataDir}/test.txt`,
    modelType: overrides.modelType ?? 'claude_cli',
    getModelClient:
      overrides.getModelClient ??
      (() => ({
        ask: async () =>
          JSON.stringify({
            decision: undefined,
            reason: 'Using mock model client',
          }),
      })),
  } as Config
}
