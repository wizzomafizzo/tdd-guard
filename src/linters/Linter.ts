import { LintResult } from '@tdd-guard/contracts'

export interface Linter {
  lint(filePaths: string[], configPath?: string): Promise<LintResult>
}
