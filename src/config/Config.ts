import path from 'path'
import { ConfigOptions } from '../contracts/types/ConfigOptions'
import { ClientType } from '../contracts/types/ClientType'

const TEST_RESULTS_FILENAME = 'test.json'
const TODOS_FILENAME = 'todos.json'
const MODIFICATIONS_FILENAME = 'modifications.json'
const LINT_FILENAME = 'lint.json'
const CONFIG_FILENAME = 'config.json'
const INSTRUCTIONS_FILENAME = 'instructions.md'

export const DEFAULT_MODEL_VERSION = 'claude-sonnet-4-0'
export const DEFAULT_CLIENT: ClientType = 'cli'
export const DEFAULT_DATA_DIR = path.join('.claude', 'tdd-guard', 'data')

const VALID_CLIENTS = new Set<string>(['api', 'cli', 'sdk'])
const MODEL_TYPE_TO_CLIENT: Record<string, ClientType> = {
  anthropic_api: 'api',
  claude_cli: 'cli',
}

export class Config {
  readonly dataDir: string
  readonly useSystemClaude: boolean
  readonly anthropicApiKey: string | undefined
  readonly modelType: string
  readonly linterType: string | undefined
  readonly modelVersion: string
  readonly validationClient: ClientType

  constructor(options?: ConfigOptions) {
    const mode = options?.mode ?? 'production'

    this.dataDir = this.getDataDir(options)
    this.useSystemClaude = this.getUseSystemClaude(options)
    this.anthropicApiKey = this.getAnthropicApiKey(options)
    this.modelType = this.getModelType(options, mode)
    this.linterType = this.getLinterType(options)
    this.modelVersion = this.getModelVersion(options)
    this.validationClient = this.getValidationClient(options)
  }

  private getDataDir(options?: ConfigOptions): string {
    // Determine the base directory
    const baseDir = options?.projectRoot ?? this.getValidatedClaudeProjectDir()

    // If we have a base directory, construct the full path
    if (baseDir) {
      return path.join(baseDir, DEFAULT_DATA_DIR)
    }

    // Default to relative path
    return DEFAULT_DATA_DIR
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

  get instructionsFilePath(): string {
    return path.join(this.dataDir, INSTRUCTIONS_FILENAME)
  }

  private getLinterType(options?: ConfigOptions): string | undefined {
    if (options && 'linterType' in options) {
      return options.linterType?.toLowerCase()
    }
    const envValue = process.env.LINTER_TYPE?.toLowerCase()
    return envValue && envValue.trim() !== '' ? envValue : undefined
  }

  private getModelVersion(options?: ConfigOptions): string {
    return (
      options?.modelVersion ??
      process.env.TDD_GUARD_MODEL_VERSION ??
      DEFAULT_MODEL_VERSION
    )
  }

  private getValidationClient(options?: ConfigOptions): ClientType {
    return (
      getClientType(options) ?? getLegacyClientType(options) ?? DEFAULT_CLIENT
    )
  }

  private getValidatedClaudeProjectDir(): string | null {
    const projectDir = process.env.CLAUDE_PROJECT_DIR
    if (!projectDir) {
      return null
    }

    // Validate that CLAUDE_PROJECT_DIR is an absolute path
    if (!path.isAbsolute(projectDir)) {
      throw new Error('CLAUDE_PROJECT_DIR must be an absolute path')
    }

    // Validate that CLAUDE_PROJECT_DIR does not contain path traversal
    if (projectDir.includes('..')) {
      throw new Error('CLAUDE_PROJECT_DIR must not contain path traversal')
    }

    // Validate that current working directory is within CLAUDE_PROJECT_DIR
    const cwd = process.cwd()
    if (!cwd.startsWith(projectDir)) {
      throw new Error(
        'CLAUDE_PROJECT_DIR must contain the current working directory'
      )
    }

    return projectDir
  }
}

function getClientType(options?: ConfigOptions): ClientType | undefined {
  const directValue = options?.validationClient ?? process.env.VALIDATION_CLIENT
  const normalizedValue = directValue?.toLowerCase()
  return isValidClient(normalizedValue) ? normalizedValue : undefined
}

function getLegacyClientType(options?: ConfigOptions): ClientType | undefined {
  const modelType = options?.modelType ?? process.env.MODEL_TYPE
  return mapModelTypeToClient(modelType)
}

function isValidClient(value?: string): value is ClientType {
  return VALID_CLIENTS.has(value ?? '')
}

function mapModelTypeToClient(modelType?: string): ClientType | undefined {
  const normalizedType = modelType?.toLowerCase()
  return normalizedType ? MODEL_TYPE_TO_CLIENT[normalizedType] : undefined
}
