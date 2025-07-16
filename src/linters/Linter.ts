import { LintData } from '../contracts/schemas/lintSchemas'

export interface Linter {
  lint(
    filePaths: string[],
    configPath?: string
  ): Promise<Omit<LintData, 'hasNotifiedAboutLintIssues'>>
}
