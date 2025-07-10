export class Config {
  readonly dataDir: string
  readonly useLocalClaude: boolean
  readonly anthropicApiKey: string | undefined

  constructor() {
    this.dataDir = '.claude/tdd-guard/data'
    this.useLocalClaude = process.env.USE_LOCAL_CLAUDE === 'true'
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY
  }

  get testReportPath(): string {
    return `${this.dataDir}/test.txt`
  }
}
