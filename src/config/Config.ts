export class Config {
  readonly dataDir: string
  readonly claudeBinaryPath: string

  constructor() {
    this.dataDir = process.env.TDD_DATA_DIR || '.claude/tdd-guard/data'
    this.claudeBinaryPath = process.env.CLAUDE_BINARY_PATH || 'claude'
  }

  get testReportPath(): string {
    return `${this.dataDir}/test.txt`
  }

  get fileStoragePath(): string {
    return `${this.dataDir}/storage`
  }
}
