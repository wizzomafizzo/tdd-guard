export interface TestScenarios {
  singlePassing: string
  singleFailing: string
  singleImportError: string
}

export interface ReporterConfig {
  name: string
  reporterPath: string
  configFileName: string
  artifactDir: string
  testScenarios: TestScenarios
  createConfig: (tempDir: string, reporterPath: string) => string
  runCommand: (
    tempDir: string,
    configPath: string,
    artifactPath: string
  ) => void
}

export interface TestResultData {
  testModules: Array<{
    moduleId: string
    tests: Array<{
      name: string
      fullName: string
      state: string
      errors?: Array<{
        message: string
        expected?: string
        actual?: string
      }>
    }>
  }>
  reason: string
}
