export class Config {
  readonly dataDir: string
  readonly useLocalClaude: boolean

  constructor() {
    this.dataDir = '.claude/tdd-guard/data'
    this.useLocalClaude = process.env.USE_LOCAL_CLAUDE === 'true'
  }

  get testReportPath(): string {
    return `${this.dataDir}/test.txt`
  }

  get fileStoragePath(): string {
    return `${this.dataDir}/storage`
  }
}
