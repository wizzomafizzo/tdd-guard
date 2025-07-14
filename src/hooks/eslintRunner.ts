import { LintData, LintIssue, ESLintResult, ESLintMessage } from '../contracts/schemas/lintSchemas'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const buildCommand = (files: string[], configPath?: string): string => 
  ['npx eslint', files.join(' '), '--format json', configPath && `-c "${configPath}"`]
    .filter(Boolean)
    .join(' ')

const parseResults = (stdout?: string): ESLintResult[] => {
  try {
    return JSON.parse(stdout ?? '[]')
  } catch {
    return []
  }
}

const toIssue = (filePath: string) => (msg: ESLintMessage): LintIssue => ({
  file: filePath,
  line: msg.line ?? 0,
  column: msg.column ?? 0,
  severity: (msg.severity === 2 ? 'error' : 'warning') as 'error' | 'warning',
  message: msg.message,
  rule: msg.ruleId
})

const extractIssues = (results: ESLintResult[]): LintIssue[] =>
  results.flatMap(file => (file.messages ?? []).map(toIssue(file.filePath)))

const countBySeverity = (issues: LintIssue[], severity: 'error' | 'warning'): number =>
  issues.filter(i => i.severity === severity).length

const createLintData = (
  timestamp: string,
  files: string[],
  results: ESLintResult[]
): Omit<LintData, 'hasNotifiedAboutLintIssues'> => {
  const issues = extractIssues(results)
  return {
    timestamp,
    files,
    issues,
    errorCount: countBySeverity(issues, 'error'),
    warningCount: countBySeverity(issues, 'warning')
  }
}

const isExecError = (error: unknown): error is Error & { stdout?: string } =>
  error !== null && typeof error === 'object' && 'stdout' in error

export async function runESLint(
  filePaths: string[], 
  configPath?: string
): Promise<Omit<LintData, 'hasNotifiedAboutLintIssues'>> {
  const timestamp = new Date().toISOString()
  const command = buildCommand(filePaths, configPath)
  
  try {
    await execAsync(command)
    return createLintData(timestamp, filePaths, [])
  } catch (error) {
    if (!isExecError(error)) throw error
    
    const results = parseResults(error.stdout)
    return createLintData(timestamp, filePaths, results)
  }
}