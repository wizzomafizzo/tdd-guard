import { describe, test, expect } from 'vitest'
import { testData } from '@testUtils'
import { generateDynamicContext } from './context'
import { ROLE_AND_CONTEXT } from '../prompts/role-and-context'
import { TDD_CORE_PRINCIPLES } from '../prompts/tdd-core-principles'
import { FILE_TYPE_RULES } from '../prompts/file-type-rules'
import { RESPONSE_FORMAT } from '../prompts/response-format'
import { EDIT_ANALYSIS } from '../prompts/edit-analysis'
import { MULTI_EDIT_ANALYSIS } from '../prompts/multi-edit-analysis'
import { WRITE_ANALYSIS } from '../prompts/write-analysis'

describe('generateDynamicContext', () => {
  describe('when Edit operation', () => {
    test('should format Edit operation with file path, old content, and new content', () => {
      const editOperation = testData.editOperation()
      const context = {
        modifications: JSON.stringify(editOperation),
      }

      const result = generateDynamicContext(context)

      // Check core sections are included
      expect(result).toContain(ROLE_AND_CONTEXT)
      expect(result).toContain(TDD_CORE_PRINCIPLES)
      expect(result).toContain(FILE_TYPE_RULES)
      expect(result).toContain(EDIT_ANALYSIS)
      expect(result).toContain(RESPONSE_FORMAT)

      // Check modifications section
      expect(result).toContain('## Changes to Review')
      expect(result).toContain(
        'This section shows the code changes being proposed'
      )
      expect(result).toContain('### File Path')
      expect(result).toContain('```')
      expect(result).toContain(editOperation.tool_input.file_path)
      expect(result).toContain('### Old Content')
      expect(result).toContain(editOperation.tool_input.old_string)
      expect(result).toContain('### New Content')
      expect(result).toContain(editOperation.tool_input.new_string)
    })
  })

  describe('when MultiEdit operation', () => {
    test('should format MultiEdit operation with file path and edits array', () => {
      const multiEditOperation = testData.multiEditOperation()
      const context = {
        modifications: JSON.stringify(multiEditOperation),
      }

      const result = generateDynamicContext(context)

      // Check core sections are included
      expect(result).toContain(ROLE_AND_CONTEXT)
      expect(result).toContain(TDD_CORE_PRINCIPLES)
      expect(result).toContain(FILE_TYPE_RULES)
      expect(result).toContain(MULTI_EDIT_ANALYSIS)
      expect(result).toContain(RESPONSE_FORMAT)

      // Check modifications section
      expect(result).toContain('## Changes to Review')
      expect(result).toContain(
        'This section shows the code changes being proposed'
      )
      expect(result).toContain('### File Path')
      expect(result).toContain('```')
      expect(result).toContain(multiEditOperation.tool_input.file_path)
      expect(result).toContain('### Edits')
      expect(result).toContain('#### Edit 1:')
      expect(result).toContain('**Old Content:**')
      expect(result).toContain(
        multiEditOperation.tool_input.edits[0].old_string
      )
      expect(result).toContain('**New Content:**')
      expect(result).toContain(
        multiEditOperation.tool_input.edits[0].new_string
      )
    })
  })

  describe('when Write operation', () => {
    test('should format Write operation with file path and content', () => {
      const writeOperation = testData.writeOperation()
      const context = {
        modifications: JSON.stringify(writeOperation),
      }

      const result = generateDynamicContext(context)

      // Check core sections are included
      expect(result).toContain(ROLE_AND_CONTEXT)
      expect(result).toContain(TDD_CORE_PRINCIPLES)
      expect(result).toContain(FILE_TYPE_RULES)
      expect(result).toContain(WRITE_ANALYSIS)
      expect(result).toContain(RESPONSE_FORMAT)

      // Check modifications section
      expect(result).toContain('## Changes to Review')
      expect(result).toContain('This section shows the new file being created')
      expect(result).toContain('### File Path')
      expect(result).toContain('```')
      expect(result).toContain(writeOperation.tool_input.file_path)
      expect(result).toContain('### New File Content')
      expect(result).toContain(writeOperation.tool_input.content)
    })
  })

  describe('when test output is provided', () => {
    test('should append test information with description', () => {
      const editOperation = testData.editOperation()
      const testOutput = JSON.stringify(testData.failedTestResults())
      const context = {
        modifications: JSON.stringify(editOperation),
        test: testOutput,
      }

      const result = generateDynamicContext(context)

      expect(result).toContain('### Test Output')
      expect(result).toContain(
        'This section shows the output from the most recent test run'
      )
      expect(result).toContain('Which tests are failing and why')
      expect(result).toContain('```')
      // Should contain formatted output, not raw JSON
      expect(result).toContain(' Test Files  1 failed (1)')
    })

    test('should format JSON test results using TestResultsProcessor', () => {
      const editOperation = testData.editOperation()
      const testResults = testData.failedTestResults()
      const context = {
        modifications: JSON.stringify(editOperation),
        test: JSON.stringify(testResults),
      }

      const result = generateDynamicContext(context)

      expect(result).toContain('### Test Output')
      // Should contain formatted output from TestResultsProcessor
      expect(result).toContain(' ❯ /src/example.test.ts (1 tests | 1 failed)')
      expect(result).toContain('   × Calculator > should calculate sum')
      expect(result).toContain('     → expected 5 to be 6')
      expect(result).toContain(' Test Files  1 failed (1)')
      expect(result).toContain('      Tests  1 failed (1)')
      // Should NOT contain raw JSON
      expect(result).not.toContain('"testModules"')
      expect(result).not.toContain('"moduleId"')
    })
  })

  describe('when todo is provided', () => {
    test('should append todo information with description', () => {
      const editOperation = testData.editOperation()
      const todoWriteOperation = testData.todoWriteOperation()
      const todoJson = JSON.stringify(todoWriteOperation)
      const context = {
        modifications: JSON.stringify(editOperation),
        todo: todoJson,
      }

      const result = generateDynamicContext(context)

      expect(result).toContain('### Todo List')
      expect(result).toContain("This section shows the developer's task list")
      expect(result).toContain('What the developer is currently working on')
      expect(result).toContain('[pending] Implement feature (high)')
    })
  })

  describe('prompt ordering', () => {
    test('should assemble prompts in correct order', () => {
      const editOperation = testData.editOperation()
      const context = {
        modifications: JSON.stringify(editOperation),
      }

      const result = generateDynamicContext(context)

      // Verify order by checking indexOf
      const roleIndex = result.indexOf('You are a Test-Driven Development')
      const principlesIndex = result.indexOf('## TDD Fundamentals')
      const fileRulesIndex = result.indexOf('## File Type Specific Rules')
      const analysisIndex = result.indexOf('## Analyzing Edit Operations')
      const changesIndex = result.indexOf('## Changes to Review')
      const responseIndex = result.indexOf('## Your Response')

      expect(roleIndex).toBeLessThan(principlesIndex)
      expect(principlesIndex).toBeLessThan(fileRulesIndex)
      expect(fileRulesIndex).toBeLessThan(analysisIndex)
      expect(analysisIndex).toBeLessThan(changesIndex)
      expect(changesIndex).toBeLessThan(responseIndex)
    })
  })

  describe('operation-specific analysis inclusion', () => {
    test('should include only Edit analysis for Edit operations', () => {
      const editOperation = testData.editOperation()
      const context = {
        modifications: JSON.stringify(editOperation),
      }

      const result = generateDynamicContext(context)

      expect(result).toContain(EDIT_ANALYSIS)
      expect(result).not.toContain(MULTI_EDIT_ANALYSIS)
      expect(result).not.toContain(WRITE_ANALYSIS)
    })

    test('should include only MultiEdit analysis for MultiEdit operations', () => {
      const multiEditOperation = testData.multiEditOperation()
      const context = {
        modifications: JSON.stringify(multiEditOperation),
      }

      const result = generateDynamicContext(context)

      expect(result).toContain(MULTI_EDIT_ANALYSIS)
      expect(result).not.toContain(EDIT_ANALYSIS)
      expect(result).not.toContain(WRITE_ANALYSIS)
    })

    test('should include only Write analysis for Write operations', () => {
      const writeOperation = testData.writeOperation()
      const context = {
        modifications: JSON.stringify(writeOperation),
      }

      const result = generateDynamicContext(context)

      expect(result).toContain(WRITE_ANALYSIS)
      expect(result).not.toContain(EDIT_ANALYSIS)
      expect(result).not.toContain(MULTI_EDIT_ANALYSIS)
    })
  })
})
