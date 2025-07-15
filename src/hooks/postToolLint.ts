import { ValidationResult } from '../contracts/types/ValidationResult'
import { LintData, LintDataSchema } from '../contracts/schemas/lintSchemas'
import { HookDataSchema, HookData } from '../contracts/schemas/toolSchemas'
import { Storage } from '../storage/Storage'
import { runESLint } from './eslintRunner'

const DEFAULT_RESULT: ValidationResult = {
  decision: undefined,
  reason: ''
}

export async function handlePostToolLint(
  hookData: string,
  storage: Storage
): Promise<ValidationResult> {
  const parsedData = JSON.parse(hookData)

  const hookResult = HookDataSchema.safeParse(parsedData)
  if (!hookResult.success) {
    return DEFAULT_RESULT
  }

  // Only process PostToolUse hooks
  if (hookResult.data.hook_event_name !== 'PostToolUse') {
    return DEFAULT_RESULT
  }

  // Extract file paths from tool operation
  const filePaths = extractFilePaths(hookResult.data)
  if (filePaths.length === 0) {
    return DEFAULT_RESULT
  }

  // Get current lint data to check hasNotifiedAboutLintIssues state
  let storedLintData
  try {
    const lintDataStr = await storage.getLint()
    if (lintDataStr) {
      storedLintData = LintDataSchema.parse(JSON.parse(lintDataStr))
    }
  } catch {
    storedLintData = null
  }

  // Run ESLint on the files
  const lintResults = await runESLint(filePaths)
  const hasIssues = lintResults.errorCount > 0 || lintResults.warningCount > 0

  // Update lint data with new results
  const lintData: LintData = {
    ...lintResults,
    hasNotifiedAboutLintIssues: hasIssues 
      ? (storedLintData?.hasNotifiedAboutLintIssues ?? false)  // Preserve flag when issues exist
      : false  // Reset flag when no issues
  }

  // Always save lint data
  await storage.saveLint(JSON.stringify(lintData))

  // Block if:
  // 1. PreToolUse has notified (flag is true)
  // 2. There are still issues
  if (storedLintData?.hasNotifiedAboutLintIssues && hasIssues) {
    // Format the lint issues for display
    const issuesByFile = new Map<string, string[]>()
    for (const issue of lintData.issues) {
      if (!issuesByFile.has(issue.file)) {
        issuesByFile.set(issue.file, [])
      }
      const ruleInfo = issue.rule ? `  ${issue.rule}` : ''
      issuesByFile.get(issue.file)!.push(
        `  ${issue.line}:${issue.column}  ${issue.severity}  ${issue.message}${ruleInfo}`
      )
    }

    let formattedIssues = ''
    for (const [file, issues] of issuesByFile) {
      formattedIssues += `\n${file}\n${issues.join('\n')}`
    }

    const summary = `\n✖ ${lintData.errorCount + lintData.warningCount} problems (${lintData.errorCount} errors, ${lintData.warningCount} warnings)`

    return {
      decision: 'block',
      reason: `Lint issues detected:${formattedIssues}\n${summary}\n\nPlease fix these issues before proceeding.`
    }
  }

  return DEFAULT_RESULT
}

function extractFilePaths(hookData: HookData): string[] {
  const toolInput = hookData.tool_input
  if (!toolInput || typeof toolInput !== 'object') return []

  const paths: string[] = []

  if ('file_path' in toolInput && typeof toolInput.file_path === 'string') {
    paths.push(toolInput.file_path)
  }

  // Handle multi-edit operations
  if ('edits' in toolInput && Array.isArray(toolInput.edits)) {
    for (const edit of toolInput.edits) {
      if ('file_path' in edit && typeof edit.file_path === 'string') {
        paths.push(edit.file_path)
      }
    }
  }

  return [...new Set(paths)] // Remove duplicates
}