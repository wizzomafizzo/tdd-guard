export type ConfigOptions = {
  mode?: 'production' | 'test'
  dataDir?: string
  useSystemClaude?: boolean
  anthropicApiKey?: string
  modelType?: string
  linterType?: string
}
