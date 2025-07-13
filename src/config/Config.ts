export type ConfigOptions = {
  mode?: 'production' | 'test'
  dataDir?: string
}

export class Config {
  readonly dataDir: string
  readonly useSystemClaude: boolean
  readonly anthropicApiKey: string | undefined
  readonly modelType: string

  constructor(options?: ConfigOptions) {
    const mode = options?.mode ?? 'production'

    this.dataDir = options?.dataDir ?? '.claude/tdd-guard/data'
    this.useSystemClaude = process.env.USE_SYSTEM_CLAUDE === 'true'
    this.anthropicApiKey = process.env.TDD_GUARD_ANTHROPIC_API_KEY

    // Use TEST_MODEL_TYPE in test mode if available
    this.modelType =
      mode === 'test' && process.env.TEST_MODEL_TYPE
        ? process.env.TEST_MODEL_TYPE
        : process.env.MODEL_TYPE || 'claude_cli'
  }

  get testReportPath(): string {
    return `${this.dataDir}/test.txt`
  }
}
