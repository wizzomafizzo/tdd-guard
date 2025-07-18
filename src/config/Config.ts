import path from 'path'

const TEST_RESULTS_FILENAME = 'test.json'
const TODOS_FILENAME = 'todos.json'
const MODIFICATIONS_FILENAME = 'modifications.json'
const LINT_FILENAME = 'lint.json'
const CONFIG_FILENAME = 'config.json'

export type ConfigOptions = {
  mode?: 'production' | 'test'
  dataDir?: string
  useSystemClaude?: boolean
  anthropicApiKey?: string
  modelType?: string
  linterType?: string
}

export class Config {
  readonly dataDir: string
  readonly useSystemClaude: boolean
  readonly anthropicApiKey: string | undefined
  readonly modelType: string
  readonly linterType: string | undefined

  constructor(options?: ConfigOptions) {
    const mode = options?.mode ?? 'production'

    this.dataDir = this.getDataDir(options)
    this.useSystemClaude = this.getUseSystemClaude(options)
    this.anthropicApiKey = this.getAnthropicApiKey(options)
    this.modelType = this.getModelType(options, mode)
    this.linterType = this.getLinterType(options)
  }

  private getDataDir(options?: ConfigOptions): string {
    return options?.dataDir ?? '.claude/tdd-guard/data'
  }

  private getUseSystemClaude(options?: ConfigOptions): boolean {
    return options?.useSystemClaude ?? process.env.USE_SYSTEM_CLAUDE === 'true'
  }

  private getAnthropicApiKey(options?: ConfigOptions): string | undefined {
    return options?.anthropicApiKey ?? process.env.TDD_GUARD_ANTHROPIC_API_KEY
  }

  private getModelType(
    options: ConfigOptions | undefined,
    mode: string
  ): string {
    return (
      options?.modelType ?? this.getEnvironmentModelType(mode) ?? 'claude_cli'
    )
  }

  private getEnvironmentModelType(mode: string): string | undefined {
    if (mode === 'test' && process.env.TEST_MODEL_TYPE) {
      return process.env.TEST_MODEL_TYPE
    }
    return process.env.MODEL_TYPE
  }

  get testResultsFilePath(): string {
    return path.join(this.dataDir, TEST_RESULTS_FILENAME)
  }

  get todosFilePath(): string {
    return path.join(this.dataDir, TODOS_FILENAME)
  }

  get modificationsFilePath(): string {
    return path.join(this.dataDir, MODIFICATIONS_FILENAME)
  }

  get lintFilePath(): string {
    return path.join(this.dataDir, LINT_FILENAME)
  }

  get configFilePath(): string {
    return path.join(this.dataDir, CONFIG_FILENAME)
  }

  private getLinterType(options?: ConfigOptions): string | undefined {
    if (options?.linterType) {
      return options.linterType.toLowerCase()
    }
    const envValue = process.env.LINTER_TYPE?.toLowerCase()
    return envValue && envValue.trim() !== '' ? envValue : undefined
  }
}
